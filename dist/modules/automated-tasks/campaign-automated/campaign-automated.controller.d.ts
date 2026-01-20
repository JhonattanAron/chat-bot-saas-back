import { Model } from "mongoose";
import { Campaign } from "./campaign.schema";
import { CampaignsAutomatedService } from "./campaign-automated.service";
export declare class CampaignAutomatedController {
    private readonly campaignsService;
    private readonly campaignModel;
    constructor(campaignsService: CampaignsAutomatedService, campaignModel: Model<Campaign>);
    runCampaign(body: {
        userId: string;
        searchQuery: string;
    }): Promise<{
        campaignId: import("mongoose").Types.ObjectId;
        batchId: string;
    }>;
    getCampaignStatus(campaignId: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        status: import("./campaign.schema").CampaignStatus;
        scraping_exitoso: boolean;
        urls_procesadas: number;
        informacion_extraida: number;
        emails_encontrados: number;
        emails_normalizados: boolean;
        emails_enviados: import("mongoose").FlattenMaps<{
            correctos: number;
            incorrectos: number;
        }>;
        error: string | null;
        updatedAt: Date;
    }>;
}
