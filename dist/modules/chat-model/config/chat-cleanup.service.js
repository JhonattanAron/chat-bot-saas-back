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
exports.ChatCleanupService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("../schemas/chat.schema");
const schedule_1 = require("@nestjs/schedule");
let ChatCleanupService = class ChatCleanupService {
    constructor(chatModel) {
        this.chatModel = chatModel;
    }
    async handleCleanup() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        await this.chatModel.deleteMany({ lastActivityAt: { $lt: oneHourAgo } });
    }
};
exports.ChatCleanupService = ChatCleanupService;
__decorate([
    (0, schedule_1.Cron)("*/10 * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatCleanupService.prototype, "handleCleanup", null);
exports.ChatCleanupService = ChatCleanupService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatCleanupService);
//# sourceMappingURL=chat-cleanup.service.js.map