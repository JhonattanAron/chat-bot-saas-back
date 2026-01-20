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
exports.BatchesController = void 0;
const common_1 = require("@nestjs/common");
const batches_service_1 = require("./batches.service");
let BatchesController = class BatchesController {
    constructor(batchesService) {
        this.batchesService = batchesService;
    }
    async createBatch(body) {
        return this.batchesService.createBatch(body.user_id, body.search_query);
    }
    async findAll() {
        return this.batchesService.findAll();
    }
    async getAllEmails() {
        return this.batchesService.getAllEmailsGroupedByBatch();
    }
    async findById(id) {
        return this.batchesService.findById(id);
    }
    async getLeads(id) {
        return this.batchesService.getLeadsByBatchId(id);
    }
    async getEmails(id) {
        return this.batchesService.getEmailsByBatchId(id);
    }
    async extract(batchId) {
        return this.batchesService.extractBatch(batchId);
    }
    async exportBatch(id) {
        const exportData = await this.batchesService.getLatestExport(id);
        if (!exportData) {
            throw new common_1.HttpException("No export found. Please generate plain text first.", common_1.HttpStatus.NOT_FOUND);
        }
        const formattedContent = exportData.content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join("  ");
        const filename = `leadscraper-${exportData.batch_id}-${new Date().toISOString().split("T")[0]}.txt`;
        return {
            filename,
            content: formattedContent,
            contentType: "text/plain",
        };
    }
    async getPlainText() {
        const data = await this.batchesService.findAllPlaintextExports();
        return data;
    }
    async generate(batchId) {
        return this.batchesService.generateBatch(batchId);
    }
    async updateAnalized(id, analized, analized_data) {
        return this.batchesService.updateAnalizedData(id, analized, analized_data);
    }
    async getAnalizedText(id) {
        return this.batchesService.JsonAnalized(id);
    }
    async normalizeEmails(batchId, body) {
        if (!body.user_id) {
            throw new common_1.BadRequestException("user_id is required");
        }
        if (!body.leads || body.leads.length === 0) {
            throw new common_1.BadRequestException("leads are required");
        }
        return this.batchesService.normalizeEmailsWithAI(body.user_id, batchId, body.leads);
    }
};
exports.BatchesController = BatchesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("emails"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getAllEmails", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(":id/leads"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Get)(":id/emails"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getEmails", null);
__decorate([
    (0, common_1.Post)(":id/extract"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "extract", null);
__decorate([
    (0, common_1.Get)(":id/export"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "exportBatch", null);
__decorate([
    (0, common_1.Get)("get/text"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getPlainText", null);
__decorate([
    (0, common_1.Post)(":id/generate"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "generate", null);
__decorate([
    (0, common_1.Patch)(":id/analized"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("analized")),
    __param(2, (0, common_1.Body)("analized_data")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "updateAnalized", null);
__decorate([
    (0, common_1.Get)(":id/json-analized"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getAnalizedText", null);
__decorate([
    (0, common_1.Post)(":id/normalize-emails"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "normalizeEmails", null);
exports.BatchesController = BatchesController = __decorate([
    (0, common_1.Controller)("batches"),
    __metadata("design:paramtypes", [batches_service_1.BatchesService])
], BatchesController);
//# sourceMappingURL=batches.controller.js.map