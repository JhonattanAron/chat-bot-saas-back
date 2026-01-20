import { TelegramChatService } from "./telegram-chat.service";
export declare class TelegramChatController {
    private readonly telegramChatService;
    constructor(telegramChatService: TelegramChatService);
    handleWebhook(botToken: string, body: any): Promise<{
        error: string;
        success?: undefined;
        chatId?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        chatId: unknown;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
        chatId?: undefined;
    } | {
        success: boolean;
        error: any;
        chatId?: undefined;
        message?: undefined;
    }>;
    connectBot(body: {
        token: string;
        userId: string;
        assistantId: string;
    }): Promise<import("./schemas/telegram-bot.schema").TelegramBotDocument>;
    disconnectBot(botId: string): Promise<boolean>;
    getConnectedBots(): Promise<import("./schemas/telegram-bot.schema").TelegramBotDocument[]>;
    getUserBots(userId: string): Promise<import("./schemas/telegram-bot.schema").TelegramBotDocument[]>;
    sendMessageWithBot(botId: string, body: {
        chatId: string;
        message: string;
    }): Promise<any>;
    getTelegramChat(chatId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/telegram-chat.schema").TelegramChatDocument, {}> & import("./schemas/telegram-chat.schema").TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getTelegramChatByTelegramId(telegramChatId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/telegram-chat.schema").TelegramChatDocument, {}> & import("./schemas/telegram-chat.schema").TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getUserTelegramChats(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/telegram-chat.schema").TelegramChatDocument, {}> & import("./schemas/telegram-chat.schema").TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getAssistantTelegramChats(assistantId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/telegram-chat.schema").TelegramChatDocument, {}> & import("./schemas/telegram-chat.schema").TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    test(): {
        ok: boolean;
        service: string;
        timestamp: string;
    };
}
