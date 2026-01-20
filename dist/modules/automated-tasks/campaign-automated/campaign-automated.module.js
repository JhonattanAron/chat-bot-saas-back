"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const campaign_schema_1 = require("./campaign.schema");
const campaign_automated_controller_1 = require("./campaign-automated.controller");
const campaign_automated_service_1 = require("./campaign-automated.service");
const batches_module_1 = require("../../batches/batches.module");
const mail_module_1 = require("../../ai-emails/mail.module");
let CampaignsModule = class CampaignsModule {
};
exports.CampaignsModule = CampaignsModule;
exports.CampaignsModule = CampaignsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            batches_module_1.BatchesModule,
            mail_module_1.MailModule,
            mongoose_1.MongooseModule.forFeature([
                { name: campaign_schema_1.Campaign.name, schema: campaign_schema_1.CampaignSchema },
            ]),
        ],
        controllers: [campaign_automated_controller_1.CampaignAutomatedController],
        providers: [campaign_automated_service_1.CampaignsAutomatedService],
    })
], CampaignsModule);
//# sourceMappingURL=campaign-automated.module.js.map