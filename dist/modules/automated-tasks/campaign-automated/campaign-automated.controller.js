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
exports.CampaignAutomatedController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const campaign_schema_1 = require("./campaign.schema");
const campaign_automated_service_1 = require("./campaign-automated.service");
let CampaignAutomatedController = class CampaignAutomatedController {
    constructor(campaignsService, campaignModel) {
        this.campaignsService = campaignsService;
        this.campaignModel = campaignModel;
    }
    async runCampaign(body) {
        if (!body.userId || !body.searchQuery) {
            throw new common_1.NotFoundException("userId y searchQuery son requeridos");
        }
        return this.campaignsService.runEmailCampaign(body.userId, body.searchQuery);
    }
    async getCampaignStatus(campaignId) {
        const campaign = await this.campaignModel.findById(campaignId).lean();
        if (!campaign) {
            throw new common_1.NotFoundException("Campaign no encontrada");
        }
        return {
            id: campaign._id,
            status: campaign.status,
            scraping_exitoso: campaign.scraping_exitoso,
            urls_procesadas: campaign.urls_procesadas,
            informacion_extraida: campaign.informacion_extraida,
            emails_encontrados: campaign.emails_encontrados,
            emails_normalizados: campaign.emails_normalizados,
            emails_enviados: campaign.emails_enviados,
            error: campaign.error ?? null,
            updatedAt: campaign.updatedAt,
        };
    }
};
exports.CampaignAutomatedController = CampaignAutomatedController;
__decorate([
    (0, common_1.Post)("emails/run"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignAutomatedController.prototype, "runCampaign", null);
__decorate([
    (0, common_1.Get)("email/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignAutomatedController.prototype, "getCampaignStatus", null);
exports.CampaignAutomatedController = CampaignAutomatedController = __decorate([
    (0, common_1.Controller)("campaign-automated"),
    __param(1, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __metadata("design:paramtypes", [campaign_automated_service_1.CampaignsAutomatedService,
        mongoose_2.Model])
], CampaignAutomatedController);
//# sourceMappingURL=campaign-automated.controller.js.map