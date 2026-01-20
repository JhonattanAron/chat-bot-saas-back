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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mail_log_schema_1 = require("./schemas/mail-log.schema");
const chat_service_1 = require("../chat-model/chat/chat.service");
const mail_template_service_1 = require("./services/mail-template.service");
let MailService = MailService_1 = class MailService {
    constructor(mailLogModel, chatService, mailTemplateService) {
        this.mailLogModel = mailLogModel;
        this.chatService = chatService;
        this.mailTemplateService = mailTemplateService;
        this.logger = new common_1.Logger(MailService_1.name);
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    async sendEmail(params) {
        console.log(params.context);
        const prompt = this.mailTemplateService.createPromptTemplate(params.context);
        console.log(prompt);
        const predict = await this.chatService.singlePredict(params.userId, prompt);
        console.log(predict);
        const assistantMessage = predict.messages.find((m) => m.role === "assistant");
        if (!assistantMessage || !assistantMessage.content.trim()) {
            return { error: "No se generó contenido para el correo." };
        }
        const html = assistantMessage.content;
        const { data, error } = await this.resend.emails.send({
            from: process.env.MAIL_FROM,
            to: params.to,
            subject: params.subject,
            html: this.mailTemplateService.createHtmlTemplate(html),
        });
        await this.mailLogModel.create({
            messageId: data?.id || "unknown",
            to: params.to,
            subject: params.subject,
            type: params.type,
            userId: params.userId,
            entityId: params.context.entityId,
            status: error ? "error" : "sent",
            batch: params.batch,
        });
        return { data, error };
    }
    async findCampaingByUserId(userId) {
        return this.mailLogModel.find({ userId }).sort({ createdAt: -1 }).exec();
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(mail_log_schema_1.MailLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        chat_service_1.ChatService,
        mail_template_service_1.MailTemplateService])
], MailService);
//# sourceMappingURL=mail.service.js.map