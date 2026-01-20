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
exports.CampaignsAutomatedService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mail_service_1 = require("../../ai-emails/mail.service");
const batches_service_1 = require("../../batches/batches.service");
const campaign_schema_1 = require("./campaign.schema");
let CampaignsAutomatedService = class CampaignsAutomatedService {
    constructor(batchesService, mailService, campaignModel) {
        this.batchesService = batchesService;
        this.mailService = mailService;
        this.campaignModel = campaignModel;
    }
    async runEmailCampaign(userId, searchQuery) {
        console.log("🚀 Iniciando campaña");
        const batch = await this.batchesService.createBatch(userId, searchQuery);
        if (!batch?._id)
            throw new Error("No se pudo crear el batch");
        const batchId = batch._id.toString();
        const campaign = await this.campaignModel.create({
            userId,
            batchId,
            status: "created",
        });
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            status: "scraping",
        });
        while (true) {
            await this.batchesService.extractBatch(batchId);
            const pendientes = await this.batchesService.countLeads(batchId, "pending");
            const extraidos = await this.batchesService.countLeads(batchId, "extracted");
            await this.campaignModel.findByIdAndUpdate(campaign._id, {
                urls_procesadas: extraidos,
                informacion_extraida: extraidos,
            });
            if (pendientes === 0)
                break;
            await new Promise((r) => setTimeout(r, 5000));
        }
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            scraping_exitoso: true,
            status: "extracted",
        });
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            status: "normalizing",
        });
        const leadsParaNormalizar = await this.batchesService.getExtractedLeadsWithEmails(batchId);
        await this.batchesService.normalizeEmailsWithAI(userId, batchId, leadsParaNormalizar.map((l) => ({
            leadId: l._id.toString(),
            emails: l.emails,
        })));
        const emailsEncontrados = leadsParaNormalizar.reduce((acc, l) => acc + (l.emails?.length || 0), 0);
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            emails_normalizados: true,
            emails_encontrados: emailsEncontrados,
        });
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            status: "sending",
        });
        const leadsFinales = await this.batchesService.getExtractedLeadsWithEmails(batchId);
        for (const lead of leadsFinales) {
            for (const email of lead.emails) {
                const res = await this.mailService.sendEmail({
                    to: email,
                    subject: `Idea para mejorar la captación de pacientes en ${lead.company_name}`,
                    type: "custom",
                    context: {
                        empresa: lead.company_name,
                        descripcion: lead.meta_description,
                        razon: "Captación digital",
                        nivel_interes: "medio",
                    },
                    userId,
                    batch: batchId,
                    entityId: lead.company_name,
                });
                if (res?.error) {
                    await this.campaignModel.findByIdAndUpdate(campaign._id, {
                        $inc: { "emails_enviados.incorrectos": 1 },
                    });
                }
                else {
                    await this.campaignModel.findByIdAndUpdate(campaign._id, {
                        $inc: { "emails_enviados.correctos": 1 },
                    });
                }
            }
        }
        await this.campaignModel.findByIdAndUpdate(campaign._id, {
            status: "completed",
        });
        return {
            campaignId: campaign._id,
            batchId,
        };
    }
};
exports.CampaignsAutomatedService = CampaignsAutomatedService;
exports.CampaignsAutomatedService = CampaignsAutomatedService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __metadata("design:paramtypes", [batches_service_1.BatchesService,
        mail_service_1.MailService,
        mongoose_2.Model])
], CampaignsAutomatedService);
//# sourceMappingURL=campaign-automated.service.js.map