"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const predictions_service_1 = require("../model-ai/predictions.service");
let ChatController = class ChatController {
    constructor(chatService, predictService) {
        this.chatService = chatService;
        this.predictService = predictService;
    }
    async startChat(body) {
        const { userId, assistant_id, promt } = body;
        if (!userId || !assistant_id || !promt) {
            return {
                success: false,
                error: "Missing required fields: userId, assistant_id, and promt are required",
                received: body,
            };
        }
        try {
            const chat = await this.chatService.createChat(userId, assistant_id, promt);
            return {
                success: true,
                chat_id: chat._id,
                user_id: userId,
                assistant_id,
                message: "Chat iniciado exitosamente",
                response: chat.messages[chat.messages.length - 1]?.content ||
                    "No response generated",
                total_messages: chat.messages.length,
            };
        }
        catch (error) {
            console.error("Error starting chat:", error);
            return {
                success: false,
                error: error.message,
                stack: error.stack,
            };
        }
    }
    async voice(body) {
        const { chatId, assistantId, audio } = body;
        if (!chatId || !assistantId || !audio) {
            throw new Error("chatId, assistantId y audio son obligatorios");
        }
        return this.chatService.voiceChat(chatId, assistantId, audio);
    }
    async sendMessage(body) {
        const { chatId, assistant_id, role, content } = body;
        if (!chatId || !assistant_id || !role || !content) {
            return {
                success: false,
                error: "Missing required fields: chatId, assistant_id, role, and content are required",
                received: body,
            };
        }
        try {
            const chat = await this.chatService.addMessage(chatId, assistant_id, role, content);
            return {
                success: true,
                chat_id: chatId,
                assistant_id,
                message: "Mensaje enviado exitosamente",
                response: chat?.messages[chat.messages.length - 1]?.content ||
                    "No response generated",
                total_messages: chat?.messages.length || 0,
            };
        }
        catch (error) {
            console.error("Error sending message:", error);
            return {
                success: false,
                error: error.message,
                stack: error.stack,
            };
        }
    }
    async getChat(chatId) {
        try {
            const chat = await this.chatService.getChat(chatId);
            if (!chat) {
                return {
                    success: false,
                    error: "Chat not found",
                };
            }
            return {
                success: true,
                chat: {
                    id: chat._id,
                    userId: chat.userId,
                    messages: chat.messages,
                    lastActivity: chat.lastActivityAt,
                    tokenUsage: {
                        input: chat.input_tokens,
                        output: chat.output_tokens,
                    },
                },
            };
        }
        catch (error) {
            console.error("Error getting chat:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getUserChats(userId) {
        try {
            const chats = await this.chatService.getUserChats(userId);
            return {
                success: true,
                user_id: userId,
                total_chats: chats.length,
                chats: chats.map((chat) => ({
                    id: chat._id,
                    lastActivity: chat.lastActivityAt,
                    messageCount: chat.messages.length,
                    lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 100) + "..." || "No messages",
                })),
            };
        }
        catch (error) {
            console.error("Error getting user chats:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async Predict(body) {
        const predict = await this.chatService.predict(body.userId, body.prompt);
        return { predict };
    }
    async testEndpoint(body) {
        return {
            success: true,
            message: "Chat controller is working",
            received_body: body,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)("start"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "startChat", null);
__decorate([
    (0, common_1.Post)("voice"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "voice", null);
__decorate([
    (0, common_1.Post)("message"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(":chatId"),
    __param(0, (0, common_1.Param)("chatId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChat", null);
__decorate([
    (0, common_1.Get)("user/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserChats", null);
__decorate([
    (0, common_1.Post)("model/predict"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "Predict", null);
__decorate([
    (0, common_1.Post)("test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "testEndpoint", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)("chat"),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        predictions_service_1.PredictionService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map