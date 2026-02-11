import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ProxyAuthGuard } from "../auth/proxy-auth.guard";
import { CampaignService } from "./campaign.service";

@Controller("whastapp-qr/campaigns")
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @UseGuards(ProxyAuthGuard)
  @Post()
  async createCampaign(
    @Body()
    body: {
      assistant_id: string;
      name: string;
      description?: string;
      message_template: string;
      contact: { name?: string; phone: string }[];
    },
    @Req() req?: any,
  ) {
    try {
      const campaign = await this.campaignService.createCampaignAndSend(
        req.user.id,
        body.assistant_id,
        body.name,
        body.description || "",
        body.message_template,
        body.contact,
      );

      return {
        success: true,
        message: "Campaign created successfully",
        campaign,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  async getCampaigns(@Query("userId") userId: string) {
    try {
      const campaigns = await this.campaignService.getCampaignsByUser(userId);
      return {
        success: true,
        total: campaigns.length,
        campaigns,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(":campaignId")
  async getCampaignById(@Param("campaignId") campaignId: string) {
    try {
      const campaign = await this.campaignService.getCampaignById(campaignId);
      if (!campaign) {
        return {
          success: false,
          error: "Campaign not found",
        };
      }

      const messages =
        await this.campaignService.getCampaignMessages(campaignId);

      return {
        success: true,
        campaign,
        messages,
        total_messages: messages.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
