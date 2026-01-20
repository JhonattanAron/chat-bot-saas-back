import { Document, Types } from "mongoose";
export type ChatDocument = Chat & Document;
export declare class Chat {
    userId: string;
    messages: {
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        important_info: string;
    }[];
    lastActivityAt: Date;
    input_tokens: number;
    output_tokens: number;
    monthly_counted_chats: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, Document<unknown, any, Chat, any> & Chat & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, Document<unknown, {}, import("mongoose").FlatRecord<Chat>, {}> & import("mongoose").FlatRecord<Chat> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
