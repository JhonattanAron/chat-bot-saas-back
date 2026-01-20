import { Document, Schema as MongooseSchema } from "mongoose";
export type FaqItemDocument = FaqItem & Document;
export declare class FaqItem {
    _id?: MongooseSchema.Types.ObjectId;
    question: string;
    answer: string;
    category: string;
    embedding?: number[];
    createdAt?: Date;
}
export declare class Faqs {
    user_id: string;
    assistant_id: string;
    faqs: FaqItem[];
}
export type FaqsDocument = Faqs & Document;
export declare const FaqsSchema: MongooseSchema<Faqs, import("mongoose").Model<Faqs, any, any, any, Document<unknown, any, Faqs, any> & Faqs & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Faqs, Document<unknown, {}, import("mongoose").FlatRecord<Faqs>, {}> & import("mongoose").FlatRecord<Faqs> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
