import { Model } from "mongoose";
import { Faqs, FaqsDocument, FaqItem } from "./schema/faqs.schema";
export declare class FaqsService {
    private faqsModel;
    constructor(faqsModel: Model<FaqsDocument>);
    createFaqs(data: {
        user_id: string;
        assistant_id: string;
        faqs: FaqItem[];
    }): Promise<import("mongoose").Document<unknown, {}, FaqsDocument, {}> & Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getFaqs(user_id: string, assistant_id: string): Promise<(import("mongoose").FlattenMaps<FaqsDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    updateFaq(user_id: string, assistant_id: string, faqId: string, update: Partial<FaqItem>): Promise<(import("mongoose").Document<unknown, {}, FaqsDocument, {}> & Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteFaq(user_id: string, assistant_id: string, faqId: string): Promise<(import("mongoose").Document<unknown, {}, FaqsDocument, {}> & Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    search(query: string, user_id: string, assistant_id: string): Promise<{
        question: string;
        answer: string;
        category: string;
        score: number;
        semanticScore: number;
    }[]>;
}
