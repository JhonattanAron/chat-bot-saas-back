import { FaqItem } from "./schema/faqs.schema";
import { FaqsService } from "./faqs.service";
export declare class FaqsController {
    private readonly faqservice;
    constructor(faqservice: FaqsService);
    searchFaqs(query: string, user_id: string, assistant_id: string): Promise<{
        question: string;
        answer: string;
        category: string;
        score: number;
        semanticScore: number;
    }[]>;
    createFaqs(body: {
        user_id: string;
        assistant_id: string;
        faqs: FaqItem[];
    }): Promise<import("mongoose").Document<unknown, {}, import("./schema/faqs.schema").FaqsDocument, {}> & import("./schema/faqs.schema").Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getFaqs(user_id: string, assistant_id: string): Promise<(import("mongoose").FlattenMaps<import("./schema/faqs.schema").FaqsDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    updateFaq(body: {
        user_id: string;
        assistant_id: string;
        faqId: string;
        update: Partial<FaqItem>;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./schema/faqs.schema").FaqsDocument, {}> & import("./schema/faqs.schema").Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteFaq(user_id: string, assistant_id: string, faqId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schema/faqs.schema").FaqsDocument, {}> & import("./schema/faqs.schema").Faqs & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
}
