import { Document } from "mongoose";
export type LeadDocument = Lead & Document;
export declare class Lead {
    batch_id: string;
    company_name: string;
    url: string;
    meta_description: string;
    emails: string[];
    phones: string[];
    social_links: string[];
    extraction_status: string;
}
export declare const LeadSchema: import("mongoose").Schema<Lead, import("mongoose").Model<Lead, any, any, any, Document<unknown, any, Lead, any> & Lead & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lead, Document<unknown, {}, import("mongoose").FlatRecord<Lead>, {}> & import("mongoose").FlatRecord<Lead> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
