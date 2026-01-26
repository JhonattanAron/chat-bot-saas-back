import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Campaign } from "./campaign.schema";
import { CampaignsAutomatedService } from "./campaign-automated.service";

@Controller("campaign-automated")
export class CampaignAutomatedController {
  constructor(
    private readonly campaignsService: CampaignsAutomatedService,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<Campaign>,
  ) {}

  @Post("emails/run")
  async runCampaign(
    @Body()
    body: {
      userId: string;
      searchQuery: string;
    },
  ) {
    if (!body.userId || !body.searchQuery) {
      throw new NotFoundException("userId y searchQuery son requeridos");
    }

    return this.campaignsService.runEmailCampaign(
      body.userId,
      body.searchQuery,
    );
  }

  // 📊 CONSULTAR ESTADO (para el bot)
  @Get("email/:id/status")
  async getCampaignStatus(@Param("id") user_id: string) {
    const campaign = await this.campaignModel
      .findOne({ userId: user_id })
      .lean();

    if (!campaign) {
      throw new NotFoundException("Campaign no encontrada");
    }

    return {
      id: campaign._id,
      status: campaign.status,
      scraping_exitoso: campaign.scraping_exitoso,
      urls_procesadas: campaign.urls_procesadas,
      informacion_extraida: campaign.informacion_extraida,
      emails_encontrados: campaign.emails_encontrados,
      emails_normalizados: campaign.emails_normalizados,
      emails_enviados: campaign.emails_enviados,
      error: campaign.error ?? null,
      updatedAt: campaign.updatedAt,
    };
  }
}
