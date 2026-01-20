import { Model } from "mongoose";
import { Chat, type ChatDocument } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { UsersService } from "src/modules/users/users.service";
import { FaqsService } from "src/modules/faqs/faqs.service";
import { CustomFunctionService } from "../services/custom-function.service";
import { PredictionLargueService } from "../model-ai/predictionlargue.service";
export declare class ChatService {
    private readonly chatModel;
    private readonly promptGen;
    private readonly predictionService;
    private readonly predictionLargeService;
    private readonly productSearchService;
    private readonly userService;
    private readonly faqsService;
    private readonly customFunctionService;
    constructor(chatModel: Model<ChatDocument>, promptGen: PromptGeneratorService, predictionService: PredictionService, predictionLargeService: PredictionLargueService, productSearchService: ProductsService, userService: UsersService, faqsService: FaqsService, customFunctionService: CustomFunctionService);
    private runAgentLoop;
    createChat(userId: string, assistantId: string, prompt: string): Promise<ChatDocument>;
    predict(userId: string, prompt: string): Promise<ChatDocument>;
    singlePredict(userId: string, prompt: string): Promise<ChatDocument>;
    addMessage(chatId: string, assistantId: string, role: "user" | "assistant", content: string): Promise<(import("mongoose").Document<unknown, {}, ChatDocument, {}> & Chat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getChat(chatId: string): Promise<(import("mongoose").Document<unknown, {}, ChatDocument, {}> & Chat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getUserChats(userId: string): Promise<(import("mongoose").Document<unknown, {}, ChatDocument, {}> & Chat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    private processModelResponse;
    private extractImportantInfo;
    private cleanModelResponse;
    private buildCompleteImportantInfo;
    private buildEnhancedMemoryContext;
    voiceChat(chatId: string, assistantId: string, audioBase64: string): Promise<{
        audio: string;
    }>;
}
