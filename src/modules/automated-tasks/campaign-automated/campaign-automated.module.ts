import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Campaign, CampaignSchema } from "./campaign.schema";
import { Batch, BatchSchema } from "src/modules/batches/batches.schema";
import { Lead, LeadSchema } from "src/modules/batches/lead.schema";
import { BatchesService } from "src/modules/batches/batches.service";
import { MailService } from "src/modules/ai-emails/mail.service";
import { CampaignAutomatedController } from "./campaign-automated.controller";
import { CampaignsAutomatedService } from "./campaign-automated.service";
import { BatchesModule } from "src/modules/batches/batches.module";
import { MailModule } from "src/modules/ai-emails/mail.module";

@Module({
  imports: [
    BatchesModule,
    MailModule,
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
    ]),
  ],
  controllers: [CampaignAutomatedController],
  providers: [CampaignsAutomatedService],
})
export class CampaignsModule {}
