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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("../chat-model/schemas/chat.schema");
const assistant_chat_schema_1 = require("../users/schemas/assistant-chat.schema");
const dashboard_stats_schema_1 = require("./dashboard-stats.schema");
const UserSchema_1 = require("../users/schemas/UserSchema");
const telegram_chat_schema_1 = require("../telegram-chat/schemas/telegram-chat.schema");
let DashboardService = class DashboardService {
    constructor() { }
    async syncCurrentStats(userId) {
        let stats = await this.dashboardStatsModel.findOne({ user_id: userId });
        if (!stats) {
            stats = await this.dashboardStatsModel.create({
                user_id: userId,
                total_bots_created: 0,
                active_bots: 0,
                total_messages: 0,
                monthly_messages: 0,
                total_input_tokens: 0,
                total_output_tokens: 0,
                monthly_input_tokens: 0,
                monthly_output_tokens: 0,
                total_conversations: 0,
                monthly_conversations: 0,
                counted_chats: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        const webChats = await this.chatModel.find({ userId });
        const telegramChats = await this.telegramChatModel.find({ userId });
        if (!webChats?.length && !telegramChats?.length)
            return;
        const allChats = [
            ...webChats.map((chat) => ({
                ...chat.toObject(),
                platform: "web",
                id: chat._id.toString(),
            })),
            ...telegramChats.map((chat) => ({
                ...chat.toObject(),
                platform: "telegram",
                id: chat._id.toString(),
            })),
        ];
        let inputSum = 0;
        let outputSum = 0;
        let messagesSum = 0;
        let newConversations = 0;
        for (const chat of allChats) {
            const counted = stats.counted_chats.find((c) => c.chat_id === chat.id);
            const newInput = chat.input_tokens - (counted?.last_input_tokens || 0);
            const newOutput = chat.output_tokens - (counted?.last_output_tokens || 0);
            if (newInput > 0 || newOutput > 0) {
                inputSum += newInput;
                outputSum += newOutput;
                messagesSum += chat.messages?.length || 0;
                if (counted) {
                    counted.last_input_tokens = chat.input_tokens;
                    counted.last_output_tokens = chat.output_tokens;
                }
                else {
                    stats.counted_chats.push({
                        chat_id: chat.id,
                        last_input_tokens: chat.input_tokens,
                        last_output_tokens: chat.output_tokens,
                    });
                    newConversations += 1;
                }
            }
        }
        if (inputSum > 0 ||
            outputSum > 0 ||
            messagesSum > 0 ||
            newConversations > 0) {
            await this.dashboardStatsModel.updateOne({ user_id: userId }, {
                $inc: {
                    total_input_tokens: inputSum,
                    total_output_tokens: outputSum,
                    monthly_input_tokens: inputSum,
                    monthly_output_tokens: outputSum,
                    total_messages: messagesSum,
                    monthly_messages: messagesSum,
                    total_conversations: newConversations,
                    monthly_conversations: newConversations,
                },
                $set: {
                    counted_chats: stats.counted_chats,
                    updatedAt: new Date(),
                },
            });
        }
    }
    async incrementBotCreated(userId) {
        await this.dashboardStatsModel.updateOne({ user_id: userId }, {
            $inc: { total_bots_created: 1, active_bots: 1 },
            $set: { updatedAt: new Date() },
        }, { upsert: true });
    }
    async getDashboardStats(userId) {
        await this.syncCurrentStats(userId);
        const stats = await this.dashboardStatsModel.findOne({ user_id: userId });
        const activeBots = stats?.active_bots || 0;
        const totalMessages = stats?.total_messages || 0;
        const totalConversations = stats?.total_conversations || 0;
        return {
            total_bots: activeBots,
            total_messages: totalMessages,
            active_users: totalConversations,
            conversion_rate: activeBots > 0
                ? Math.round((totalMessages / activeBots) * 100) / 100
                : 0,
            bots_change: `+0 desde el mes pasado`,
            messages_change: `+0 desde el mes pasado`,
            users_change: `+0 desde el mes pasado`,
            conversion_change: `+0% desde el mes pasado`,
        };
    }
    async getTokenUsage(userId) {
        await this.syncCurrentStats(userId);
        const stats = await this.dashboardStatsModel.findOne({ user_id: userId });
        const maxTokens = 10000;
        const inputTokens = stats?.total_input_tokens || 0;
        const outputTokens = stats?.total_output_tokens || 0;
        const totalUsed = inputTokens + outputTokens;
        return {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            max_tokens: maxTokens,
            usage_percentage: Math.round((totalUsed / maxTokens) * 100),
        };
    }
    async getUserBots(userId) {
        const assistants = await this.assistantChatModel
            .find({ user_id: userId })
            .exec();
        return assistants.map((assistant) => ({
            id: assistant.id.toString(),
            name: assistant.name,
            status: assistant.status,
            messages_count: assistant.all_messages || 0,
            created_at: assistant.createdAt.toISOString(),
            updated_at: assistant.updatedAt.toISOString(),
        }));
    }
    async getAnalytics(userId) {
        const stats = await this.dashboardStatsModel.findOne({ user_id: userId });
        const bots = await this.getUserBots(userId);
        const botPerformance = bots.map((bot) => ({
            bot_name: bot.name,
            messages: bot.messages_count,
            success_rate: 85 + Math.floor(Math.random() * 15),
        }));
        return {
            daily_messages: [],
            bot_performance: botPerformance,
        };
    }
    async addTokenUsage(userId, inputTokens, outputTokens) {
        await this.dashboardStatsModel.updateOne({ user_id: userId }, {
            $inc: {
                total_input_tokens: inputTokens,
                total_output_tokens: outputTokens,
                monthly_input_tokens: inputTokens,
                monthly_output_tokens: outputTokens,
            },
            $set: { updatedAt: new Date() },
        }, { upsert: true });
    }
};
exports.DashboardService = DashboardService;
__decorate([
    (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name),
    __metadata("design:type", mongoose_2.Model)
], DashboardService.prototype, "chatModel", void 0);
__decorate([
    (0, mongoose_1.InjectModel)(assistant_chat_schema_1.AssistantChat.name),
    __metadata("design:type", mongoose_2.Model)
], DashboardService.prototype, "assistantChatModel", void 0);
__decorate([
    (0, mongoose_1.InjectModel)(UserSchema_1.User.name),
    __metadata("design:type", mongoose_2.Model)
], DashboardService.prototype, "userModel", void 0);
__decorate([
    (0, mongoose_1.InjectModel)(dashboard_stats_schema_1.DashboardStats.name),
    __metadata("design:type", mongoose_2.Model)
], DashboardService.prototype, "dashboardStatsModel", void 0);
__decorate([
    (0, mongoose_1.InjectModel)(telegram_chat_schema_1.TelegramChat.name),
    __metadata("design:type", mongoose_2.Model)
], DashboardService.prototype, "telegramChatModel", void 0);
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map