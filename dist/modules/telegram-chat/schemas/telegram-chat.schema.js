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
exports.TelegramChatSchema = exports.TelegramChat = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let TelegramChat = class TelegramChat {
};
exports.TelegramChat = TelegramChat;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TelegramChat.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TelegramChat.prototype, "assistantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TelegramChat.prototype, "telegramChatId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TelegramChat.prototype, "telegramUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TelegramChat.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TelegramChat.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TelegramChat.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "active" }),
    __metadata("design:type", String)
], TelegramChat.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                role: { type: String, enum: ["user", "assistant"] },
                content: String,
                createdAt: { type: Date, default: Date.now },
                important_info: { type: String, default: "" },
                messageId: Number,
                messageType: { type: String, default: "text" },
                mediaUrl: String,
                replyToMessageId: Number,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], TelegramChat.prototype, "messages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], TelegramChat.prototype, "lastActivityAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], TelegramChat.prototype, "input_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], TelegramChat.prototype, "output_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], TelegramChat.prototype, "monthly_counted_chats", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], TelegramChat.prototype, "telegramMetadata", void 0);
exports.TelegramChat = TelegramChat = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TelegramChat);
exports.TelegramChatSchema = mongoose_1.SchemaFactory.createForClass(TelegramChat);
//# sourceMappingURL=telegram-chat.schema.js.map