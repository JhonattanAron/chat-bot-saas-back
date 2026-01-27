import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { Parser } from "json2csv";
import { PlaceLead, PlaceLeadDocument } from "../schemas/place-lead.schema";
import {
  PlacesBatch,
  PlacesBatchDocument,
} from "../schemas/places-batch.schema";

const PLACES_TYPE_MAP: Record<string, string> = {
  restaurant: "restaurant",
  hotel: "lodging",
  cafe: "cafe",
  bar: "bar",
  pharmacy: "pharmacy",
  hospital: "hospital",
  bank: "bank",
  store: "store",
};

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  private TYPES = ["restaurant", "cafe", "bar", "food"];

  constructor(
    @InjectModel(PlacesBatch.name)
    private batchModel: Model<PlacesBatchDocument>,
    @InjectModel(PlaceLead.name)
    private leadModel: Model<PlaceLeadDocument>,
  ) {}

  /* =======================
     BATCH
  ======================= */

  async extractPlaces(batchId: string) {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) throw new Error("Batch not found");

    await this.batchModel.updateOne({ _id: batchId }, { status: "running" });

    let total = 0;

    for (const type of this.TYPES) {
      total += await this.runNearbySearch({
        batchId,
        location: batch.location,
        radius: batch.radius || 1500,
        type,
      });
    }

    await this.batchModel.updateOne(
      { _id: batchId },
      { status: "done", total_places: total },
    );

    return { extracted: total };
  }

  /* =======================
     NEARBY SEARCH (BARATO)
  ======================= */

  private async runNearbySearch({
    batchId,
    location,
    radius,
    type,
  }: {
    batchId: string;
    location: { lat: number; lng: number };
    radius: number;
    type: string;
  }): Promise<number> {
    let nextPageToken: string | null = null;
    let count = 0;

    do {
      const res = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            key: this.API_KEY,
            location: `${location.lat},${location.lng}`,
            radius,
            type,
            language: "es",
            region: "ec",
            ...(nextPageToken ? { pagetoken: nextPageToken } : {}),
          },
        },
      );

      this.logger.log(
        `Nearby [${type}] status=${res.data.status} results=${res.data.results?.length}`,
      );

      for (const place of res.data.results || []) {
        const exists = await this.leadModel.exists({
          place_id: place.place_id,
        });
        if (exists) continue;

        await this.leadModel.create({
          batch_id: batchId,
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          location: place.geometry.location,
          source: "google_places",
        });

        count++;
      }

      nextPageToken = res.data.next_page_token || null;
      if (nextPageToken) await this.sleep(2000);
    } while (nextPageToken);

    return count;
  }

  /* =======================
     ENRICH (CARO)
  ======================= */

  async enrichPlaces(batchId: string) {
    const leads = await this.leadModel.find({
      batch_id: batchId,
      phone: { $exists: false },
    });

    for (const lead of leads) {
      try {
        const details = await this.getPlaceDetails(lead.place_id);
        await this.leadModel.updateOne(
          { _id: lead._id },
          {
            phone: details.formatted_phone_number,
            website: details.website,
          },
        );
      } catch {
        this.logger.warn(`Details failed ${lead.place_id}`);
      }
    }

    return { enriched: leads.length };
  }

  /* =======================
     DETAILS
  ======================= */

  private async getPlaceDetails(placeId: string) {
    const res = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          key: this.API_KEY,
          place_id: placeId,
          fields: "formatted_phone_number,website",
        },
      },
    );
    return res.data.result;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async exportBatchToCSV(batchId: string): Promise<string> {
    const leads = await this.leadModel.find(
      {
        batch_id: batchId,
        phone: { $type: "string", $ne: "" },
      },
      { name: 1, phone: 1, _id: 0 },
    );

    if (!leads.length) {
      throw new Error("No leads with valid phone found");
    }

    const { Parser } = require("json2csv");
    const parser = new Parser({
      fields: ["name", "phone"],
    });

    return parser.parse(leads);
  }
}
