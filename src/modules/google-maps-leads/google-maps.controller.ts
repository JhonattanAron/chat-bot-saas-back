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

@Controller("google-maps-leads")
export class GoogleMapsController {
  constructor(
    private readonly service: GoogleMapsService,

    @InjectModel(PlacesBatch.name)
    private readonly batchModel: Model<PlacesBatchDocument>,

    @InjectModel(PlaceLead.name)
    private readonly leadModel: Model<PlaceLeadDocument>,
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
    },
  ) {
    return this.batchModel.create({
      ...body,
      source: "google_places",
      status: "pending",
      total_places: 0,
    });
  }

  /* =======================
     GET BATCH
  ======================= */
  @Get(":id")
  async getBatch(@Param("id") id: string) {
    return this.batchModel.findById(id);
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

    return this.service.extractPlaces(id);
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
