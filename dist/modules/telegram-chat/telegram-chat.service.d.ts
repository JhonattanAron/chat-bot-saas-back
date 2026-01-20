import { Model } from "mongoose";
import { TelegramChat, TelegramChatDocument } from "./schemas/telegram-chat.schema";
import { TelegramBotDocument } from "./schemas/telegram-bot.schema";
import { PromptGeneratorService } from "../chat-model/config/prompt-generator.service";
import { PredictionService } from "../chat-model/model-ai/predictions.service";
import { ProductsService } from "../products/products.service";
import { UsersService } from "../users/users.service";
import { FaqsService } from "../faqs/faqs.service";
import { CustomFunctionService } from "../chat-model/services/custom-function.service";
export declare class TelegramChatService {
    private readonly telegramChatModel;
    private readonly telegramBotModel;
    private readonly promptGen;
    private readonly predictionService;
    private readonly productSearchService;
    private readonly userService;
    private readonly faqsService;
    private readonly customFunctionService;
    private readonly logger;
    private telegramClients;
    constructor(telegramChatModel: Model<TelegramChatDocument>, telegramBotModel: Model<TelegramBotDocument>, promptGen: PromptGeneratorService, predictionService: PredictionService, productSearchService: ProductsService, userService: UsersService, faqsService: FaqsService, customFunctionService: CustomFunctionService);
    connectBot(token: string, userId: string, assistantId: string): Promise<TelegramBotDocument>;
    private runTelegramAgent;
    private setTelegramWebhook;
    disconnectBot(botId: string): Promise<boolean>;
    getConnectedBots(userId?: string): Promise<TelegramBotDocument[]>;
    sendMessageWithBot(botId: string, chatId: string, message: string): Promise<any>;
    private validateBotToken;
    private findBotByToken;
    createTelegramChat(userId: string, assistantId: string, telegramChatId: string, telegramUserId: string, message: string, username?: string, firstName?: string, lastName?: string, messageId?: number): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    addTelegramMessage(chatId: string, assistantId: string, role: "user" | "assistant", content: string, messageId?: number): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getTelegramChat(chatId: string): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getTelegramChatByTelegramId(telegramChatId: string): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getUserTelegramChats(userId: string): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getAssistantTelegramChats(assistantId: string): Promise<(import("mongoose").Document<unknown, {}, TelegramChatDocument, {}> & TelegramChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    handleTelegramWebhook(webhookData: any, botToken: string): Promise<{
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
    private getTelegramMessageType;
    private processModelResponse;
    private extractImportantInfo;
    private cleanModelResponse;
    private buildCompleteImportantInfo;
    private buildEnhancedMemoryContext;
    private sendTelegramMessage;
}
