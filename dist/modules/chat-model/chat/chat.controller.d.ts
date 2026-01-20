import { ChatService } from "./chat.service";
import { PredictionService } from "../model-ai/predictions.service";
export declare class ChatController {
    private readonly chatService;
    private readonly predictService;
    constructor(chatService: ChatService, predictService: PredictionService);
    startChat(body: {
        userId: string;
        assistant_id: string;
        promt: string;
    }): Promise<{
        success: boolean;
        error: string;
        received: {
            userId: string;
            assistant_id: string;
            promt: string;
        };
        chat_id?: undefined;
        user_id?: undefined;
        assistant_id?: undefined;
        message?: undefined;
        response?: undefined;
        total_messages?: undefined;
        stack?: undefined;
    } | {
        success: boolean;
        chat_id: unknown;
        user_id: string;
        assistant_id: string;
        message: string;
        response: string;
        total_messages: number;
        error?: undefined;
        received?: undefined;
        stack?: undefined;
    } | {
        success: boolean;
        error: any;
        stack: any;
        received?: undefined;
        chat_id?: undefined;
        user_id?: undefined;
        assistant_id?: undefined;
        message?: undefined;
        response?: undefined;
        total_messages?: undefined;
    }>;
    voice(body: {
        chatId: string;
        assistantId: string;
        audio: string;
    }): Promise<{
        audio: string;
    }>;
    sendMessage(body: {
        chatId: string;
        assistant_id: string;
        role: "user" | "assistant";
        content: string;
    }): Promise<{
        success: boolean;
        error: string;
        received: {
            chatId: string;
            assistant_id: string;
            role: "user" | "assistant";
            content: string;
        };
        chat_id?: undefined;
        assistant_id?: undefined;
        message?: undefined;
        response?: undefined;
        total_messages?: undefined;
        stack?: undefined;
    } | {
        success: boolean;
        chat_id: string;
        assistant_id: string;
        message: string;
        response: string;
        total_messages: number;
        error?: undefined;
        received?: undefined;
        stack?: undefined;
    } | {
        success: boolean;
        error: any;
        stack: any;
        received?: undefined;
        chat_id?: undefined;
        assistant_id?: undefined;
        message?: undefined;
        response?: undefined;
        total_messages?: undefined;
    }>;
    getChat(chatId: string): Promise<{
        success: boolean;
        chat: {
            id: unknown;
            userId: string;
            messages: {
                role: "user" | "assistant";
                content: string;
                createdAt: Date;
                important_info: string;
            }[];
            lastActivity: Date;
            tokenUsage: {
                input: number;
                output: number;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        chat?: undefined;
    }>;
    getUserChats(userId: string): Promise<{
        success: boolean;
        user_id: string;
        total_chats: number;
        chats: {
            id: unknown;
            lastActivity: Date;
            messageCount: number;
            lastMessage: string;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        user_id?: undefined;
        total_chats?: undefined;
        chats?: undefined;
    }>;
    Predict(body: {
        userId: string;
        prompt: string;
    }): Promise<{
        predict: import("../schemas/chat.schema").ChatDocument;
    }>;
    testEndpoint(body: any): Promise<{
        success: boolean;
        message: string;
        received_body: any;
        timestamp: string;
    }>;
}
