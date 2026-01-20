import { Document } from "mongoose";
export type TelegramChatDocument = TelegramChat & Document;
export declare class TelegramChat {
    userId: string;
    assistantId: string;
    telegramChatId: string;
    telegramUserId: string;
    username: string;
    firstName: string;
    lastName: string;
    status: string;
    messages: {
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        important_info: string;
        messageId?: number;
        messageType?: string;
        mediaUrl?: string;
        replyToMessageId?: number;
    }[];
    lastActivityAt: Date;
    input_tokens: number;
    output_tokens: number;
    monthly_counted_chats: string[];
    telegramMetadata: {
        chatType?: string;
        isBot?: boolean;
        languageCode?: string;
        isPremium?: boolean;
        photoUrl?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const TelegramChatSchema: import("mongoose").Schema<TelegramChat, import("mongoose").Model<TelegramChat, any, any, any, Document<unknown, any, TelegramChat, any> & TelegramChat & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TelegramChat, Document<unknown, {}, import("mongoose").FlatRecord<TelegramChat>, {}> & import("mongoose").FlatRecord<TelegramChat> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
