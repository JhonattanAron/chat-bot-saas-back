import { Document } from "mongoose";
export type CampaignDocument = Campaign & Document;
export type CampaignStatus = "created" | "scraping" | "extracted" | "normalizing" | "sending" | "completed" | "error";
export declare class Campaign {
    userId: string;
    batchId: string;
    status: CampaignStatus;
    scraping_exitoso: boolean;
    urls_total: number;
    urls_procesadas: number;
    informacion_extraida: number;
    emails_encontrados: number;
    emails_normalizados: boolean;
    emails_enviados: {
        correctos: number;
        incorrectos: number;
    };
    error?: string;
    updatedAt: Date;
}
export declare const CampaignSchema: import("mongoose").Schema<Campaign, import("mongoose").Model<Campaign, any, any, any, Document<unknown, any, Campaign, any> & Campaign & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Campaign, Document<unknown, {}, import("mongoose").FlatRecord<Campaign>, {}> & import("mongoose").FlatRecord<Campaign> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
