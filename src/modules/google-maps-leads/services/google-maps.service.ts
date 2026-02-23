import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

import {
  PlacesBatch,
  PlacesBatchDocument,
} from "../schemas/places-batch.schema";
import { PlaceLead, PlaceLeadDocument } from "../schemas/place-lead.schema";
import axios from "axios";

interface ExtractOptions {
  isDeepSearch?: boolean;
  previousBatchId?: string | null;
}
export interface PlaceLeadCreate {
  place_id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_id?: string;
}

@Injectable()
export class GoogleMapsService {
  // Umbral de distancia para considerar una zona como duplicada (en km)
  private readonly ZONE_OVERLAP_THRESHOLD_KM = 0.5;

  // Keywords alternativos para búsqueda profunda
  private readonly DEEP_SEARCH_KEYWORDS_MAP: Record<string, string[]> = {
    dental: ["odontologist", "orthodontist", "periodontist", "endodontist"],
    clinic: [
      "medical center",
      "health center",
      "urgent care",
      "medical office",
    ],
    restaurant: ["café", "bistro", "gastropub", "eatery", "diner"],
    pharmacy: ["drugstore", "apothecary", "medical pharmacy"],
    gym: ["fitness", "training center", "CrossFit", "yoga studio"],
  };

  constructor(
    @InjectModel(PlacesBatch.name)
    private readonly batchModel: Model<PlacesBatchDocument>,
    @InjectModel(PlaceLead.name)
    private readonly leadModel: Model<PlaceLeadDocument>,
  ) {}

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine (en km)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifica si una zona ya fue escrapiada
   */
  async checkZoneDuplicates(
    location: { lat: number; lng: number },
    radius: number,
    userId: string,
  ): Promise<{
    isDuplicate: boolean;
    previousBatch?: {
      _id: string;
      query: string;
      location: { lat: number; lng: number };
      total_places: number;
      createdAt: string;
    };
    message: string;
  }> {
    // Buscar batches previos del usuario
    const previousBatches = await this.batchModel
      .find({ user_id: userId, status: "done" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    for (const batch of previousBatches) {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        batch.location.lat,
        batch.location.lng,
      );

      // Si la distancia es menor al umbral y los radios se solapan
      const radiusOverlap =
        distance < this.ZONE_OVERLAP_THRESHOLD_KM &&
        distance < (radius + batch.radius) / 1000;

      if (radiusOverlap) {
        return {
          isDuplicate: true,
          previousBatch: {
            _id: batch._id.toString(),
            query: batch.query,
            location: batch.location,
            total_places: batch.total_places,
            createdAt: batch.createdAt,
          },
          message: `Zone previously scraped on ${new Date(batch.createdAt).toLocaleDateString()}. Deep search enabled.`,
        };
      }
    }

    return {
      isDuplicate: false,
      message: "No previous scraping detected in this zone",
    };
  }

  /**
   * Obtiene keywords alternativos para búsqueda profunda
   */
  private getDeepSearchKeywords(originalKeywords: string[]): string[] {
    const deepSearchKeywords: string[] = [];

    for (const keyword of originalKeywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Buscar si hay keywords alternativos definidos
      for (const [key, alternatives] of Object.entries(
        this.DEEP_SEARCH_KEYWORDS_MAP,
      )) {
        if (lowerKeyword.includes(key)) {
          deepSearchKeywords.push(...alternatives);
          break;
        }
      }
    }

    return deepSearchKeywords.length > 0
      ? deepSearchKeywords
      : originalKeywords;
  }

  /**
   * Extrae lugares de Google Maps con soporte para deep search
   */
  async extractPlaces(
    batchId: string,
    options: ExtractOptions = {},
  ): Promise<{ success: boolean; message: string }> {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }
    console.log("empezando extraccion...");

    try {
      // Marcar batch como en progreso
      await this.batchModel.findByIdAndUpdate(batchId, { status: "running" });

      let keywordsToUse = batch.keywords || [];

      // Si es deep search, obtener keywords alternativos
      if (options.isDeepSearch) {
        const deepKeywords = this.getDeepSearchKeywords(batch.keywords || []);
        keywordsToUse = [...new Set([...keywordsToUse, ...deepKeywords])]; // Evitar duplicados
      }
      console.log({ keywords: keywordsToUse });

      // Obtener los place_ids del batch anterior si es deep search
      let previousPlaceIds: Set<string> = new Set();
      if (options.isDeepSearch && options.previousBatchId) {
        const previousLeads = await this.leadModel
          .find({
            batch_id: options.previousBatchId,
          })
          .select("place_id");

        previousPlaceIds = new Set(previousLeads.map((lead) => lead.place_id));
      }

      const newLeads = await this.scrapePlacesByKeywords({
        location: batch.location,
        radius: batch.radius || 1500,
        keywords: keywordsToUse,
      });

      // Filtrar resultados para deep search (excluir los del batch anterior)
      const filteredLeads = options.isDeepSearch
        ? newLeads.filter((lead) => !previousPlaceIds.has(lead.place_id))
        : newLeads;

      // Guardar los leads
      if (filteredLeads.length > 0) {
        await this.leadModel.insertMany(
          filteredLeads.map((lead) => ({
            ...lead,
            batch_id: batchId,
          })),
        );
      }

      // Actualizar batch
      await this.batchModel.findByIdAndUpdate(batchId, {
        status: "done",
        total_places: filteredLeads.length,
        completed_at: new Date(),
      });

      return {
        success: true,
        message: `Extraction completed. Found ${filteredLeads.length} ${options.isDeepSearch ? "new" : ""} places.`,
      };
    } catch (error) {
      await this.batchModel.findByIdAndUpdate(batchId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  private async scrapePlacesByKeywords({
    location,
    radius,
    keywords,
  }: {
    location: { lat: number; lng: number };
    radius: number;
    keywords: string[];
  }): Promise<PlaceLeadCreate[]> {
    const results: PlaceLeadCreate[] = [];
    const seenPlaceIds = new Set<string>();

    for (const keyword of keywords) {
      let nextPageToken: string | null = null;

      do {
        const res = await axios.get(
          "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
          {
            params: {
              key: process.env.GOOGLE_MAPS_API_KEY,
              location: `${location.lat},${location.lng}`,
              radius,
              keyword,
              language: "es",
              region: "ec",
              ...(nextPageToken ? { pagetoken: nextPageToken } : {}),
            },
          },
        );

        if (res.data.status === "OVER_QUERY_LIMIT") {
          throw new Error("Google Places API quota exceeded");
        }

        if (!res.data.results?.length) break;

        for (const place of res.data.results) {
          if (!place.place_id || seenPlaceIds.has(place.place_id)) continue;

          seenPlaceIds.add(place.place_id);

          results.push({
            place_id: place.place_id,
            name: place.name,
            address: place.vicinity,
            rating: place.rating,
          });
        }

        nextPageToken = res.data.next_page_token || null;
        if (nextPageToken) await this.sleep(2000);
      } while (nextPageToken);
    }

    return results;
  }
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normaliza teléfonos de los leads
   */

  async normalizePhones(
    batchId: string,
    country: CountryCode, // ejemplo: "EC"
  ): Promise<{ success: boolean; updated: number }> {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    const leads = await this.leadModel.find({ batch_id: batchId });
    let updated = 0;

    for (const lead of leads) {
      if (lead.phone) {
        try {
          const phoneNumber = parsePhoneNumberFromString(lead.phone, country);
          if (phoneNumber && phoneNumber.isValid()) {
            // Formato internacional E.164: +593XXXXXXXXX
            const normalized = phoneNumber.format("E.164");

            await this.leadModel.updateOne(
              { _id: lead._id },
              { phone: normalized },
            );

            updated++;
          }
        } catch (err) {
          console.warn(
            `[normalizePhones] Failed to normalize ${lead.phone}: ${
              err instanceof Error ? err.message : err
            }`,
          );
        }
      }
    }

    return { success: true, updated };
  }

  /**
   * Elimina leads sin teléfono
   */
  async deleteLeadsWithoutPhone(batchId: string): Promise<{ deleted: number }> {
    const result = await this.leadModel.deleteMany({
      batch_id: batchId,
      phone: { $in: [null, ""] },
    });

    return { deleted: result.deletedCount };
  }

  /**
   * Exporta batch a CSV
   */
  async exportBatchToCSV(batchId: string): Promise<string> {
    const leads = await this.leadModel.find({ batch_id: batchId });

    if (leads.length === 0) {
      return "No leads found";
    }

    const headers = Object.keys(leads[0].toObject());
    const csv =
      headers.join(",") +
      "\n" +
      leads
        .map((lead) =>
          headers
            .map((header) => {
              const value = lead[header as keyof typeof lead];
              return typeof value === "string" ? `"${value}"` : value;
            })
            .join(","),
        )
        .join("\n");

    return csv;
  }

  async enrichPlaces(
    batchId: string,
  ): Promise<{ success: boolean; enriched: number }> {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) throw new Error("Batch not found");

    await this.batchModel.findByIdAndUpdate(batchId, {
      status: "enriching",
    });

    const leads = await this.leadModel.find({
      batch_id: batchId,
      $or: [{ phone: { $exists: false } }, { phone: null }, { phone: "" }],
    });

    let enriched = 0;

    for (const lead of leads) {
      try {
        const details = await this.getPlaceDetails(lead.place_id);

        await this.leadModel.findByIdAndUpdate(lead._id, {
          phone: details.formatted_phone_number || null,
          website: details.website || null,
          enriched: true,
          enriched_at: new Date(),
        });

        enriched++;
        await this.sleep(150); // protege cuota
      } catch (error) {
        console.warn(
          `[enrich] Failed ${lead.place_id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    await this.batchModel.findByIdAndUpdate(batchId, {
      status: "enriched",
      enriched_count: enriched,
    });

    return {
      success: true,
      enriched,
    };
  }

  private async getPlaceDetails(placeId: string) {
    const res = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          place_id: placeId,
          fields: "formatted_phone_number,website",
          language: "es",
        },
      },
    );

    if (res.data.status !== "OK") {
      throw new Error(`Details error: ${res.data.status}`);
    }

    return res.data.result;
  }

  async getNameBatch(
    userId?: string,
  ): Promise<{ _id: string; name: string }[]> {
    const query: any = {};

    if (userId) {
      query.user_id = userId;
    }

    const batches = await this.batchModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    return batches.map((batch) => ({
      _id: batch._id.toString(),
      name: batch.batch_name + " - " + batch.query,
      contacts: batch.total_places,
    }));
  }

  async getNamesAndPhonesByBatch(batchId: string) {
    // 1️⃣ Obtener batch
    const batch = await this.batchModel.findById(batchId).lean();

    if (!batch) {
      throw new Error("Batch not found");
    }

    // 2️⃣ Obtener leads del batch
    const leads = await this.leadModel
      .find(
        { batch_id: batchId },
        { name: 1, phone: 1, id: 1 }, // SOLO lo necesario
      )
      .lean();

    // 3️⃣ Normalizar salida (array limpio)
    const normalizedLeads = leads
      .filter((l) => l.phone) // solo leads con teléfono
      .map((l) => ({
        name: l.name ?? "Sin nombre",
        phone: l.phone,
        id: l.id,
      }));

    // 4️⃣ Retorno consistente
    return {
      batch: {
        id: batch._id.toString(),
        name: batch.batch_name + " - " + batch.query,
        count: normalizedLeads.length,
      },
      leads: normalizedLeads,
    };
  }
}
