import { Document } from "mongoose";
export declare class Batch extends Document {
    user_id: string;
    search_query: string;
    status: string;
    total_urls: number;
    processed_urls: number;
    normalized_with_ai: boolean;
}
export declare const BatchSchema: import("mongoose").Schema<Batch, import("mongoose").Model<Batch, any, any, any, Document<unknown, any, Batch, any> & Batch & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Batch, Document<unknown, {}, import("mongoose").FlatRecord<Batch>, {}> & import("mongoose").FlatRecord<Batch> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
