import { Document } from "mongoose";
export type TelegramBotDocument = TelegramBot & Document;
export declare class TelegramBot {
    token: string;
    userId: string;
    assistantId: string;
    botName: string;
    botUsername: string;
    botId: string;
    isActive: boolean;
    connectedAt: Date;
    lastActivityAt: Date;
    botInfo: any;
}
export declare const TelegramBotSchema: import("mongoose").Schema<TelegramBot, import("mongoose").Model<TelegramBot, any, any, any, Document<unknown, any, TelegramBot, any> & TelegramBot & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TelegramBot, Document<unknown, {}, import("mongoose").FlatRecord<TelegramBot>, {}> & import("mongoose").FlatRecord<TelegramBot> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
