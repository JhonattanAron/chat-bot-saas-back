import { Model } from "mongoose";
import { Batch } from "./batches.schema";
import { GoogleService } from "./google.service";
import { Lead } from "./lead.schema";
import { PlainTextExport } from "./plain-text-export.schema";
import { ChatService } from "../chat-model/chat/chat.service";
import { EmailPromptService } from "./lib/utils";
export declare class BatchesService {
    private batchModel;
    private leadModel;
    private plainTextExportModel;
    private readonly googleService;
    private readonly chatPredictService;
    private readonly emailpromtService;
    constructor(batchModel: Model<Batch>, leadModel: Model<Lead>, plainTextExportModel: Model<PlainTextExport>, googleService: GoogleService, chatPredictService: ChatService, emailpromtService: EmailPromptService);
    getLatestExport(batchId: string): Promise<{
        batch_id: any;
        filename: string;
        content: string;
    } | null>;
    createBatch(userId: string, searchQuery: string): Promise<(import("mongoose").Document<unknown, {}, Batch, {}> & Batch & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    extractBatch(batchId: string): Promise<{
        success: boolean;
        processed: number;
        message: string;
    } | {
        success: boolean;
        processed: number;
        message?: undefined;
    }>;
    extractLeadData(url: string): Promise<{
        companyName: string;
        title: string;
        metaDescription: string;
        emails: string[];
        phones: string[];
        socialLinks: string[];
    }>;
    generateBatch(batchId: string): Promise<{
        success: boolean;
        leadsCount: number;
        message: string;
    }>;
    findAll(): Promise<Batch[]>;
    findAllPlaintextExports(): Promise<PlainTextExport[]>;
    getLeadsByBatchId(batchId: string): Promise<(import("mongoose").Document<unknown, {}, Lead, {}> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    updateAnalizedData(id: string, analized: boolean, analized_data: string): Promise<PlainTextExport>;
    findById(id: string): Promise<Batch | null>;
    JsonAnalized(id: string): Promise<PlainTextExport>;
    getEmailsByBatchId(batchId: string): Promise<{
        batch_id: string;
        search_query: string;
        leads: {
            leadId: string;
            emails: string[];
        }[];
    }>;
    getAllEmailsGroupedByBatch(): Promise<{
        batch_id: string;
        search_query: string;
        emails: string[];
    }[]>;
    normalizeEmailsWithAI(userId: string, batchId: string, leads: {
        leadId: string;
        emails: string[];
    }[]): Promise<{
        batch_id: string;
        success: boolean;
        normalized_leads: number;
    }>;
    countLeads(batchId: string, status: string): Promise<number>;
    getExtractedLeadsWithEmails(batchId: string): Promise<(import("mongoose").Document<unknown, {}, Lead, {}> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
}
