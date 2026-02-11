import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";
import { WhatsappGateway } from "./whatsapp.gateway";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";
import {
  CampaignMessage,
  CampaignMessageSchema,
} from "./schemas/campaign-message.schema";
import { ChatModule } from "../chat-model/chat/chat.module";
import {
  WhastAppCampaign,
  WhastAppCampaignSchema,
} from "./schemas/campaign.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhastAppCampaign.name, schema: WhastAppCampaignSchema },
      { name: CampaignMessage.name, schema: CampaignMessageSchema },
    ]),
    ChatModule,
  ],
  controllers: [WhatsappController, CampaignController],
  providers: [WhatsappService, WhatsappGateway, CampaignService],
  exports: [WhatsappService, CampaignService],
})
export class WhatsappModule {}
