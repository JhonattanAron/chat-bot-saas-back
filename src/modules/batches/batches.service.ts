import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Batch } from "./batches.schema";
import { CreateBatchDto } from "./create-batch.dto";
import { GoogleService } from "./google.service";
import { Lead } from "./lead.schema";
import * as cheerio from "cheerio";
import { PlainTextExport } from "./plain-text-export.schema";
import { title } from "process";

@Injectable()
export class BatchesService {
  constructor(
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(PlainTextExport.name)
    private plainTextExportModel: Model<PlainTextExport>,
    private readonly googleService: GoogleService
  ) {}

  async getLatestExport(batchId: string): Promise<{
    batch_id: any;
    filename: string;
    content: string;
  } | null> {
    const exportData = await this.plainTextExportModel
      .findOne({ batch_id: batchId })
      .sort({ createdAt: -1 })
      .exec();

    if (!exportData) {
      return null;
    }

    // Formatear el contenido
    const formattedContent = exportData.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("  "); // Separar cada línea por doble espacio para lectura

    const filename = `leadscraper-${exportData.batch_id}-${new Date().toISOString().split("T")[0]}.txt`;

    return {
      batch_id: exportData.batch_id,
      filename,
      content: formattedContent,
    };
  }

  async createBatch(userId: string, searchQuery: string) {
    const batch = await this.batchModel.create({
      user_id: userId,
      search_query: searchQuery,
      status: "pending",
      total_urls: 0,
      processed_urls: 0,
    });

    // Marcar batch como procesando
    await this.batchModel.findByIdAndUpdate(batch._id, {
      status: "processing",
    });

    try {
      // Buscar en Google
      const results = await this.googleService.search(searchQuery, 100);

      if (!results || results.length === 0) {
        await this.batchModel.findByIdAndUpdate(batch._id, {
          status: "failed",
        });

        // retornar batch actualizado para que Next.js lo vea
        return await this.batchModel.findById(batch._id);
      }

      // Guardar leads
      const leads = results.map((r) => ({
        batch_id: batch._id,
        company_name: r.title,
        url: r.url,
        meta_description: r.snippet,
        extraction_status: "pending",
      }));

      await this.leadModel.insertMany(leads);

      // Actualizar batch con total_urls y estado final
      await this.batchModel.findByIdAndUpdate(batch._id, {
        total_urls: leads.length,
        processed_urls: 0,
        status: "completed",
      });
    } catch (err) {
      console.error("Batch creation error:", err);
      await this.batchModel.findByIdAndUpdate(batch._id, { status: "failed" });
    }

    // 🔥 siempre devolver el batch actualizado
    return await this.batchModel.findById(batch._id);
  }

  async extractBatch(batchId: string) {
    const batch = await this.batchModel.findById(batchId);

    if (!batch) {
      throw new NotFoundException("Batch not found");
    }

    // Obtener leads pendientes
    const leads = await this.leadModel
      .find({
        batch_id: batchId,
        extraction_status: "pending",
      })
      .limit(100);

    if (leads.length === 0) {
      return {
        success: true,
        processed: 0,
        message: "No pending leads to process",
      };
    }

    // Cambiar estado del batch
    await this.batchModel.findByIdAndUpdate(batchId, {
      status: "processing",
      updatedAt: new Date(),
    });

    let processed = 0;

    for (const lead of leads) {
      try {
        const extracted = await this.extractLeadData(lead.url);

        await this.leadModel.findByIdAndUpdate(lead._id, {
          company_name: extracted.companyName,
          title: extracted.title,
          meta_description: extracted.metaDescription,
          emails: extracted.emails,
          phones: extracted.phones,
          social_links: extracted.socialLinks,
          extraction_status: "extracted",
        });

        processed++;

        await this.batchModel.findByIdAndUpdate(batchId, {
          $inc: { processed_urls: 1 },
        });

        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error("Failed extracting:", lead.url, err);

        await this.leadModel.findByIdAndUpdate(lead._id, {
          extraction_status: "failed",
        });
      }
    }

    // Verificar si ya terminó
    const pending = await this.leadModel.countDocuments({
      batch_id: batchId,
      extraction_status: "pending",
    });

    if (pending === 0) {
      await this.batchModel.findByIdAndUpdate(batchId, {
        status: "completed",
      });
    }

    return { success: true, processed };
  }

  async extractLeadData(url: string) {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 LeadScraperBot/1.0" },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      "";

    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";

    let companyName =
      $('meta[property="og:site_name"]').attr("content")?.trim() ||
      $('meta[name="application-name"]').attr("content")?.trim() ||
      $("h1").first().text().trim() ||
      "";

    if (!companyName && title) {
      companyName = title.split("|")[0].split("-")[0].trim();
    }

    // Emails
    const emails = [
      ...new Set(
        $("body")
          .text()
          .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
      ),
    ].slice(0, 5);

    // Phones
    const phones = [
      ...new Set(
        $("body")
          .text()
          .match(/\+?\d[\d\s().-]{7,}/g) || []
      ),
    ].slice(0, 3);

    // Social links
    const socials: string[] = [];
    const domains = [
      "facebook.com",
      "twitter.com",
      "x.com",
      "linkedin.com",
      "instagram.com",
      "youtube.com",
      "tiktok.com",
    ];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      for (const d of domains) {
        if (href.includes(d) && !socials.includes(href)) {
          socials.push(href);
        }
      }
    });

    return {
      companyName,
      title,
      metaDescription,
      emails,
      phones,
      socialLinks: socials.slice(0, 5),
    };
  }

  async generateBatch(batchId: string) {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) {
      throw new NotFoundException("Batch not found");
    }

    // Obtener todos los leads extraídos
    const leads = await this.leadModel.find({
      batch_id: batchId,
      extraction_status: "extracted",
    });

    if (!leads || leads.length === 0) {
      throw new BadRequestException(
        "No extracted leads found. Please extract information first."
      );
    }

    // Generar texto plano
    const plainTextLines: string[] = [];

    for (const lead of leads) {
      plainTextLines.push(`EMPRESA: ${lead.company_name || "Unknown"}`);
      plainTextLines.push(`URL: ${lead.url}`);
      plainTextLines.push(`DESCRIPCIÓN: ${lead.meta_description || "N/A"}`);
      plainTextLines.push(
        `CORREOS: ${
          lead.emails && lead.emails.length > 0 ? lead.emails.join(", ") : "N/A"
        }`
      );
      plainTextLines.push(
        `TELÉFONOS: ${
          lead.phones && lead.phones.length > 0 ? lead.phones.join(", ") : "N/A"
        }`
      );
      plainTextLines.push(
        `REDES: ${
          lead.social_links && lead.social_links.length > 0
            ? lead.social_links.join(", ")
            : "N/A"
        }`
      );
      plainTextLines.push("----------------------------------------");
      plainTextLines.push(""); // línea vacía entre registros
    }

    const plainText = plainTextLines.join("\n");

    // Guardar en base de datos
    await this.plainTextExportModel.create({
      batch_id: batchId,
      filename: `${batch.search_query}`,
      content: plainText,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      leadsCount: leads.length,
      message: "Plain text export generated successfully",
    };
  }

  async findAll(): Promise<Batch[]> {
    return this.batchModel.find().exec();
  }
  async findAllPlaintextExports(): Promise<PlainTextExport[]> {
    return this.plainTextExportModel.find().exec();
  }
  async getLeadsByBatchId(batchId: string) {
    return this.leadModel.find({ batch_id: batchId }).exec();
  }
  async updateAnalizedData(
    id: string,
    analized: boolean,
    analized_data: string
  ): Promise<PlainTextExport> {
    const updated = await this.plainTextExportModel.findByIdAndUpdate(
      id,
      { analized, analized_data, updatedAt: new Date() },
      { new: true } // devuelve el documento actualizado
    );

    if (!updated) {
      throw new NotFoundException(`PlainTextExport con id ${id} no encontrado`);
    }

    return updated;
  }

  async findById(id: string): Promise<Batch | null> {
    return this.batchModel.findById(id).exec();
  }

  async JsonAnalized(id: string): Promise<PlainTextExport> {
    const data = await this.plainTextExportModel.findById(id);

    if (!data) {
      throw new NotFoundException(`PlainTextExport con id ${id} no encontrado`);
    }

    return data;
  }
}
