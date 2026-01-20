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
exports.AssistantChatSchema = exports.AssistantChat = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const functions_schema_1 = require("./functions-schema");
let AssistantChat = class AssistantChat {
};
exports.AssistantChat = AssistantChat;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [functions_schema_1.FunctionItemSchema], default: [] }),
    __metadata("design:type", Array)
], AssistantChat.prototype, "funciones", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "use_case", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AssistantChat.prototype, "welcome_message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], AssistantChat.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], AssistantChat.prototype, "updatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], AssistantChat.prototype, "all_messages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "0 minutes" }),
    __metadata("design:type", String)
], AssistantChat.prototype, "last_activiti", void 0);
exports.AssistantChat = AssistantChat = __decorate([
    (0, mongoose_1.Schema)()
], AssistantChat);
exports.AssistantChatSchema = mongoose_1.SchemaFactory.createForClass(AssistantChat);
//# sourceMappingURL=assistant-chat.schema.js.map