import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
  Res,
} from "@nestjs/common";
import { GoogleMapsService } from "./services/google-maps.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Response } from "express";
import {
  PlacesBatch,
  PlacesBatchDocument,
} from "./schemas/places-batch.schema";
import { PlaceLead, PlaceLeadDocument } from "./schemas/place-lead.schema";
import { CountryCode } from "libphonenumber-js";

@Controller("google-maps-leads")
export class GoogleMapsController {
  constructor(
    @InjectModel(PlacesBatch.name)
    private readonly batchModel: Model<PlacesBatchDocument>,
    @InjectModel(PlaceLead.name)
    private readonly leadModel: Model<PlaceLeadDocument>,
    private readonly service: GoogleMapsService,
  ) {}

  /* =======================
     CREATE BATCH
  ======================= */

  @Post()
  async createBatch(
    @Body()
    body: {
      user_id: string;
      query: string;
      location: { lat: number; lng: number };
      radius?: number;
      batch_name?: string;
      keywords?: string[];
      categories?: string[];
      is_deep_search?: boolean;
      previous_batch_id?: string;
    },
  ) {
    // Validar que los keywords y categorías estén presentes
    if (!body.keywords || body.keywords.length === 0) {
      throw new BadRequestException("At least one keyword is required");
    }
    if (!body.categories || body.categories.length === 0) {
      throw new BadRequestException("At least one category is required");
    }

    return this.batchModel.create({
      user_id: body.user_id,
      query: body.query,
      location: body.location,
      radius: body.radius || 1000,
      batch_name: body.batch_name,
      keywords: body.keywords,
      categories: body.categories,
      is_deep_search: body.is_deep_search || false,
      previous_batch_id: body.previous_batch_id || null,
      source: "google_places",
      status: "pending",
      total_places: 0,
      createdAt: new Date(),
    });
  }

  @Get("/:userId/list")
  async getBatchesByUser(@Param("userId") userId: string) {
    return this.batchModel.find({ user_id: userId }).sort({ createdAt: -1 });
  }

  /* =======================
     CHECK ZONE FOR DUPLICATES
  ======================= */
  @Post("check-zone")
  async checkZone(
    @Body()
    body: {
      location: { lat: number; lng: number };
      radius: number;
      user_id: string;
    },
  ) {
    if (!body.location || !body.user_id) {
      throw new BadRequestException("Location and user_id are required");
    }

    const result = await this.service.checkZoneDuplicates(
      body.location,
      body.radius,
      body.user_id,
    );

    return result;
  }

  /* =======================
     GET BATCH
  ======================= */
  @Get(":id")
  async getBatch(@Param("id") id: string) {
    return this.batchModel.findById(id);
  }

  @Post(":id/normalize-phones")
  async normalizePhones(
    @Param("id") id: string,
    @Body() body: { country: CountryCode },
  ) {
    if (!body.country) throw new BadRequestException("Country is required");

    return this.service.normalizePhones(id, body.country);
  }

  @Post(":id/delete-without-phone")
  async deleteWithoutPhone(@Param("id") id: string) {
    return this.service.deleteLeadsWithoutPhone(id);
  }

  /* =======================
     GET LEADS
  ======================= */
  @Get(":id/leads")
  async getLeads(@Param("id") id: string) {
    return this.leadModel.find({ batch_id: id });
  }

  /* =======================
     RUN NEARBY EXTRACTION
  ======================= */
  @Post(":id/extract")
  async extract(@Param("id") id: string) {
    const batch = await this.batchModel.findById(id);
    if (!batch) throw new BadRequestException("Batch not found");

    if (batch.status === "running")
      throw new BadRequestException("Batch already running");

    if (batch.status === "done")
      throw new BadRequestException("Batch already completed");

    // Si es deep search, pasar el batch anterior para excluir resultados duplicados
    const extractOptions = {
      isDeepSearch: batch.is_deep_search || false,
      previousBatchId: batch.previous_batch_id || null,
    };

    return this.service.extractPlaces(id, extractOptions);
  }

  /* =======================
     ENRICH (PHONE + WEB)
  ======================= */
  @Post(":id/enrich")
  async enrich(@Param("id") id: string) {
    const batch = await this.batchModel.findById(id);
    if (!batch) throw new BadRequestException("Batch not found");

    return this.service.enrichPlaces(id);
  }

  @Get(":id/export/csv")
  async exportCSV(@Param("id") id: string, @Res() res: Response) {
    const csv = await this.service.exportBatchToCSV(id);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=google-maps-leads-${id}.csv`,
    );

    res.send(csv);
  }
}
