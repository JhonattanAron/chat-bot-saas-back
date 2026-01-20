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
exports.TelegramChatController = void 0;
const common_1 = require("@nestjs/common");
const telegram_chat_service_1 = require("./telegram-chat.service");
let TelegramChatController = class TelegramChatController {
    constructor(telegramChatService) {
        this.telegramChatService = telegramChatService;
    }
    async handleWebhook(botToken, body) {
        return this.telegramChatService.handleTelegramWebhook(body, botToken);
    }
    async connectBot(body) {
        const { token, userId, assistantId } = body;
        return this.telegramChatService.connectBot(token, userId, assistantId);
    }
    async disconnectBot(botId) {
        return this.telegramChatService.disconnectBot(botId);
    }
    async getConnectedBots() {
        return this.telegramChatService.getConnectedBots();
    }
    async getUserBots(userId) {
        return this.telegramChatService.getConnectedBots(userId);
    }
    async sendMessageWithBot(botId, body) {
        return this.telegramChatService.sendMessageWithBot(botId, body.chatId, body.message);
    }
    async getTelegramChat(chatId) {
        return this.telegramChatService.getTelegramChat(chatId);
    }
    async getTelegramChatByTelegramId(telegramChatId) {
        return this.telegramChatService.getTelegramChatByTelegramId(telegramChatId);
    }
    async getUserTelegramChats(userId) {
        return this.telegramChatService.getUserTelegramChats(userId);
    }
    async getAssistantTelegramChats(assistantId) {
        return this.telegramChatService.getAssistantTelegramChats(assistantId);
    }
    test() {
        return {
            ok: true,
            service: "telegram-chat",
            timestamp: new Date().toISOString(),
        };
    }
};
exports.TelegramChatController = TelegramChatController;
__decorate([
    (0, common_1.Post)("webhook/:botToken"),
    __param(0, (0, common_1.Param)("botToken")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)("connect"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "connectBot", null);
__decorate([
    (0, common_1.Delete)(":botId/disconnect"),
    __param(0, (0, common_1.Param)("botId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "disconnectBot", null);
__decorate([
    (0, common_1.Get)("bots"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getConnectedBots", null);
__decorate([
    (0, common_1.Get)("bots/user/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getUserBots", null);
__decorate([
    (0, common_1.Post)(":botId/send"),
    __param(0, (0, common_1.Param)("botId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "sendMessageWithBot", null);
__decorate([
    (0, common_1.Get)(":chatId"),
    __param(0, (0, common_1.Param)("chatId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getTelegramChat", null);
__decorate([
    (0, common_1.Get)("telegram/:telegramChatId"),
    __param(0, (0, common_1.Param)("telegramChatId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getTelegramChatByTelegramId", null);
__decorate([
    (0, common_1.Get)("user/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getUserTelegramChats", null);
__decorate([
    (0, common_1.Get)("assistant/:assistantId"),
    __param(0, (0, common_1.Param)("assistantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramChatController.prototype, "getAssistantTelegramChats", null);
__decorate([
    (0, common_1.Post)("test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramChatController.prototype, "test", null);
exports.TelegramChatController = TelegramChatController = __decorate([
    (0, common_1.Controller)("telegram-chat"),
    __metadata("design:paramtypes", [telegram_chat_service_1.TelegramChatService])
], TelegramChatController);
//# sourceMappingURL=telegram-chat.controller.js.map