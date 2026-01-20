import { BatchesService } from "./batches.service";
export declare class BatchesController {
    private readonly batchesService;
    constructor(batchesService: BatchesService);
    createBatch(body: {
        user_id: string;
        search_query: string;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./batches.schema").Batch, {}> & import("./batches.schema").Batch & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    findAll(): Promise<import("./batches.schema").Batch[]>;
    getAllEmails(): Promise<{
        batch_id: string;
        search_query: string;
        emails: string[];
    }[]>;
    findById(id: string): Promise<import("./batches.schema").Batch | null>;
    getLeads(id: string): Promise<(import("mongoose").Document<unknown, {}, import("./lead.schema").Lead, {}> & import("./lead.schema").Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    getEmails(id: string): Promise<{
        batch_id: string;
        search_query: string;
        leads: {
            leadId: string;
            emails: string[];
        }[];
    }>;
    extract(batchId: string): Promise<{
        success: boolean;
        processed: number;
        message: string;
    } | {
        success: boolean;
        processed: number;
        message?: undefined;
    }>;
    exportBatch(id: string): Promise<{
        filename: string;
        content: string;
        contentType: string;
    }>;
    getPlainText(): Promise<import("./plain-text-export.schema").PlainTextExport[]>;
    generate(batchId: string): Promise<{
        success: boolean;
        leadsCount: number;
        message: string;
    }>;
    updateAnalized(id: string, analized: boolean, analized_data: string): Promise<import("./plain-text-export.schema").PlainTextExport>;
    getAnalizedText(id: string): Promise<import("./plain-text-export.schema").PlainTextExport>;
    normalizeEmails(batchId: string, body: {
        user_id: string;
        leads: {
            leadId: string;
            emails: string[];
        }[];
    }): Promise<{
        batch_id: string;
        success: boolean;
        normalized_leads: number;
    }>;
}
