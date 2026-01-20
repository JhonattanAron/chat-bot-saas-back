"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const chat_schema_1 = require("../chat-model/schemas/chat.schema");
const assistant_chat_schema_1 = require("../users/schemas/assistant-chat.schema");
const UserSchema_1 = require("../users/schemas/UserSchema");
const dashboard_stats_schema_1 = require("./dashboard-stats.schema");
const telegram_chat_schema_1 = require("../telegram-chat/schemas/telegram-chat.schema");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: chat_schema_1.Chat.name, schema: chat_schema_1.ChatSchema },
                { name: assistant_chat_schema_1.AssistantChat.name, schema: assistant_chat_schema_1.AssistantChatSchema },
                { name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema },
                { name: dashboard_stats_schema_1.DashboardStats.name, schema: dashboard_stats_schema_1.DashboardStatsSchema },
                { name: telegram_chat_schema_1.TelegramChat.name, schema: telegram_chat_schema_1.TelegramChatSchema },
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map