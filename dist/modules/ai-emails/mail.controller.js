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
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const mail_service_1 = require("./mail.service");
const send_leads_mails_dto_1 = require("./dto/send-leads-mails.dto");
let MailController = class MailController {
    constructor(mailService) {
        this.mailService = mailService;
    }
    async sendLeadsEmails(dto) {
        const results = [];
        for (const lead of dto.leads) {
            if (!lead.emails || lead.emails.length === 0)
                continue;
            for (const email of lead.emails) {
                try {
                    const response = await this.mailService.sendEmail({
                        to: email,
                        subject: `Idea para mejorar la captación de pacientes en ${lead.empresa}`,
                        type: "custom",
                        context: {
                            empresa: lead.empresa,
                            descripcion: lead.descripcion,
                            razon: lead.razon,
                            nivel_interes: lead.nivel_interes,
                        },
                        entityId: lead.empresa,
                        userId: lead.userId,
                        batch: lead.batch,
                    });
                    results.push({
                        empresa: lead.empresa,
                        email,
                        status: "sent",
                        messageId: response.data?.id,
                        userId: lead.userId,
                        batch: lead.batch ?? null,
                    });
                }
                catch (err) {
                    results.push({
                        empresa: lead.empresa,
                        email,
                        status: "error",
                        error: err.message || "Unknown error",
                        userId: lead.userId,
                        batch: lead.batch,
                    });
                }
            }
        }
        return {
            total: results.length,
            sent: results.filter((r) => r.status === "sent").length,
            failed: results.filter((r) => r.status === "error").length,
            results,
        };
    }
    async getByUserId(userId) {
        return this.mailService.findCampaingByUserId(userId);
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Post)("send-leads"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_leads_mails_dto_1.SendLeadsMailsDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "sendLeadsEmails", null);
__decorate([
    (0, common_1.Get)("campaing/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "getByUserId", null);
exports.MailController = MailController = __decorate([
    (0, common_1.Controller)("mail"),
    __metadata("design:paramtypes", [mail_service_1.MailService])
], MailController);
//# sourceMappingURL=mail.controller.js.map