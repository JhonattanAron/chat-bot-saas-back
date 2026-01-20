import { Model } from "mongoose";
import { MailService } from "src/modules/ai-emails/mail.service";
import { BatchesService } from "src/modules/batches/batches.service";
import { Campaign } from "./campaign.schema";
export declare class CampaignsAutomatedService {
    private readonly batchesService;
    private readonly mailService;
    private campaignModel;
    constructor(batchesService: BatchesService, mailService: MailService, campaignModel: Model<Campaign>);
    runEmailCampaign(userId: string, searchQuery: string): Promise<{
        campaignId: import("mongoose").Types.ObjectId;
        batchId: string;
    }>;
}
