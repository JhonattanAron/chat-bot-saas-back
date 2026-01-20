"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const batches_schema_1 = require("./batches.schema");
const google_service_1 = require("./google.service");
const lead_schema_1 = require("./lead.schema");
const cheerio = __importStar(require("cheerio"));
const plain_text_export_schema_1 = require("./plain-text-export.schema");
const chat_service_1 = require("../chat-model/chat/chat.service");
const utils_1 = require("./lib/utils");
let BatchesService = class BatchesService {
    constructor(batchModel, leadModel, plainTextExportModel, googleService, chatPredictService, emailpromtService) {
        this.batchModel = batchModel;
        this.leadModel = leadModel;
        this.plainTextExportModel = plainTextExportModel;
        this.googleService = googleService;
        this.chatPredictService = chatPredictService;
        this.emailpromtService = emailpromtService;
    }
    async getLatestExport(batchId) {
        const exportData = await this.plainTextExportModel
            .findOne({ batch_id: batchId })
            .sort({ createdAt: -1 })
            .exec();
        if (!exportData) {
            return null;
        }
        const formattedContent = exportData.content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join("  ");
        const filename = `leadscraper-${exportData.batch_id}-${new Date().toISOString().split("T")[0]}.txt`;
        return {
            batch_id: exportData.batch_id,
            filename,
            content: formattedContent,
        };
    }
    async createBatch(userId, searchQuery) {
        const batch = await this.batchModel.create({
            user_id: userId,
            search_query: searchQuery,
            status: "pending",
            total_urls: 0,
            processed_urls: 0,
        });
        await this.batchModel.findByIdAndUpdate(batch._id, {
            status: "processing",
        });
        try {
            const results = await this.googleService.search(searchQuery, 10);
            if (!results || results.length === 0) {
                await this.batchModel.findByIdAndUpdate(batch._id, {
                    status: "failed",
                });
                return await this.batchModel.findById(batch._id);
            }
            const leads = results.map((r) => ({
                batch_id: batch._id,
                company_name: r.title,
                url: r.url,
                meta_description: r.snippet,
                extraction_status: "pending",
            }));
            await this.leadModel.insertMany(leads);
            await this.batchModel.findByIdAndUpdate(batch._id, {
                total_urls: leads.length,
                processed_urls: 0,
                status: "completed",
            });
        }
        catch (err) {
            console.error("Batch creation error:", err);
            await this.batchModel.findByIdAndUpdate(batch._id, { status: "failed" });
        }
        return await this.batchModel.findById(batch._id);
    }
    async extractBatch(batchId) {
        const batch = await this.batchModel.findById(batchId);
        if (!batch) {
            throw new common_1.NotFoundException("Batch not found");
        }
        const leads = await this.leadModel
            .find({
            batch_id: batchId,
            extraction_status: "pending",
        })
            .limit(100);
        if (leads.length === 0) {
            return {
                success: true,
                processed: 0,
                message: "No pending leads to process",
            };
        }
        await this.batchModel.findByIdAndUpdate(batchId, {
            status: "processing",
            updatedAt: new Date(),
        });
        let processed = 0;
        for (const lead of leads) {
            try {
                const extracted = await this.extractLeadData(lead.url);
                await this.leadModel.findByIdAndUpdate(lead._id, {
                    company_name: extracted.companyName,
                    title: extracted.title,
                    meta_description: extracted.metaDescription,
                    emails: extracted.emails,
                    phones: extracted.phones,
                    social_links: extracted.socialLinks,
                    extraction_status: "extracted",
                });
                processed++;
                await this.batchModel.findByIdAndUpdate(batchId, {
                    $inc: { processed_urls: 1 },
                });
                await new Promise((r) => setTimeout(r, 100));
            }
            catch (err) {
                console.error("Failed extracting:", lead.url, err);
                await this.leadModel.findByIdAndUpdate(lead._id, {
                    extraction_status: "failed",
                });
            }
        }
        const pending = await this.leadModel.countDocuments({
            batch_id: batchId,
            extraction_status: "pending",
        });
        if (pending === 0) {
            await this.batchModel.findByIdAndUpdate(batchId, {
                status: "completed",
            });
        }
        return { success: true, processed };
    }
    async extractLeadData(url) {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 LeadScraperBot/1.0" },
        });
        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $("title").text().trim() ||
            $('meta[property="og:title"]').attr("content")?.trim() ||
            "";
        const metaDescription = $('meta[name="description"]').attr("content")?.trim() ||
            $('meta[property="og:description"]').attr("content")?.trim() ||
            "";
        let companyName = $('meta[property="og:site_name"]').attr("content")?.trim() ||
            $('meta[name="application-name"]').attr("content")?.trim() ||
            $("h1").first().text().trim() ||
            "";
        if (!companyName && title) {
            companyName = title.split("|")[0].split("-")[0].trim();
        }
        const emails = [
            ...new Set($("body")
                .text()
                .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []),
        ].slice(0, 5);
        const phones = [
            ...new Set($("body")
                .text()
                .match(/\+?\d[\d\s().-]{7,}/g) || []),
        ].slice(0, 3);
        const socials = [];
        const domains = [
            "facebook.com",
            "twitter.com",
            "x.com",
            "linkedin.com",
            "instagram.com",
            "youtube.com",
            "tiktok.com",
        ];
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href");
            if (!href)
                return;
            for (const d of domains) {
                if (href.includes(d) && !socials.includes(href)) {
                    socials.push(href);
                }
            }
        });
        return {
            companyName,
            title,
            metaDescription,
            emails,
            phones,
            socialLinks: socials.slice(0, 5),
        };
    }
    async generateBatch(batchId) {
        const batch = await this.batchModel.findById(batchId);
        if (!batch) {
            throw new common_1.NotFoundException("Batch not found");
        }
        const leads = await this.leadModel.find({
            batch_id: batchId,
            extraction_status: "extracted",
        });
        if (!leads || leads.length === 0) {
            throw new common_1.BadRequestException("No extracted leads found. Please extract information first.");
        }
        const plainTextLines = [];
        for (const lead of leads) {
            plainTextLines.push(`EMPRESA: ${lead.company_name || "Unknown"}`);
            plainTextLines.push(`URL: ${lead.url}`);
            plainTextLines.push(`DESCRIPCIÓN: ${lead.meta_description || "N/A"}`);
            plainTextLines.push(`CORREOS: ${lead.emails && lead.emails.length > 0 ? lead.emails.join(", ") : "N/A"}`);
            plainTextLines.push(`TELÉFONOS: ${lead.phones && lead.phones.length > 0 ? lead.phones.join(", ") : "N/A"}`);
            plainTextLines.push(`REDES: ${lead.social_links && lead.social_links.length > 0
                ? lead.social_links.join(", ")
                : "N/A"}`);
            plainTextLines.push("----------------------------------------");
            plainTextLines.push("");
        }
        const plainText = plainTextLines.join("\n");
        await this.plainTextExportModel.create({
            batch_id: batchId,
            filename: `${batch.search_query}`,
            content: plainText,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return {
            success: true,
            leadsCount: leads.length,
            message: "Plain text export generated successfully",
        };
    }
    async findAll() {
        return this.batchModel.find().exec();
    }
    async findAllPlaintextExports() {
        return this.plainTextExportModel.find().exec();
    }
    async getLeadsByBatchId(batchId) {
        return this.leadModel.find({ batch_id: batchId }).exec();
    }
    async updateAnalizedData(id, analized, analized_data) {
        const updated = await this.plainTextExportModel.findByIdAndUpdate(id, { analized, analized_data, updatedAt: new Date() }, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException(`PlainTextExport con id ${id} no encontrado`);
        }
        return updated;
    }
    async findById(id) {
        return this.batchModel.findById(id).exec();
    }
    async JsonAnalized(id) {
        const data = await this.plainTextExportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException(`PlainTextExport con id ${id} no encontrado`);
        }
        return data;
    }
    async getEmailsByBatchId(batchId) {
        const leads = await this.leadModel.find({
            batch_id: batchId,
            extraction_status: "extracted",
        });
        const batch = await this.batchModel.findById(batchId);
        return {
            batch_id: batchId,
            search_query: batch?.search_query || "Unknown",
            leads: leads.map((l) => ({
                leadId: l._id.toString(),
                emails: l.emails ?? [],
            })),
        };
    }
    async getAllEmailsGroupedByBatch() {
        const leads = await this.leadModel.find({
            extraction_status: "extracted",
        });
        const grouped = leads.reduce((acc, lead) => {
            const batchId = lead.batch_id;
            if (!acc[batchId]) {
                acc[batchId] = [];
            }
            acc[batchId].push(...lead.emails.filter((email) => email));
            return acc;
        }, {});
        const result = await Promise.all(Object.entries(grouped).map(async ([batchId, emails]) => {
            const batch = await this.batchModel.findById(batchId);
            return {
                batch_id: batchId,
                search_query: batch?.search_query || "Unknown",
                emails: [...new Set(emails)],
            };
        }));
        return result;
    }
    async normalizeEmailsWithAI(userId, batchId, leads) {
        if (!leads || leads.length === 0) {
            throw new common_1.BadRequestException("No leads provided");
        }
        const prompt = this.emailpromtService.buildNormalizeLeadsEmailsPrompt(leads);
        const chat = await this.chatPredictService.singlePredict(userId, prompt);
        const rawOutput = chat.messages?.[chat.messages.length - 1]?.content || "";
        let parsed;
        try {
            parsed = JSON.parse(rawOutput);
        }
        catch {
            throw new common_1.BadRequestException("AI response is not valid JSON");
        }
        if (!Array.isArray(parsed.leads)) {
            throw new common_1.BadRequestException("AI response has invalid format");
        }
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const lead of parsed.leads) {
            if (!lead.leadId || !Array.isArray(lead.emails))
                continue;
            const normalized = [
                ...new Set(lead.emails
                    .map((e) => e.toLowerCase().trim())
                    .filter((e) => EMAIL_REGEX.test(e))),
            ];
            await this.leadModel.findByIdAndUpdate(lead.leadId, {
                emails: normalized,
            });
        }
        await this.batchModel.findByIdAndUpdate(batchId, {
            normalized_with_ai: true,
            updatedAt: new Date(),
        });
        return {
            batch_id: batchId,
            success: true,
            normalized_leads: parsed.leads.length,
        };
    }
    async countLeads(batchId, status) {
        return this.leadModel.countDocuments({
            batch_id: batchId,
            extraction_status: status,
        });
    }
    async getExtractedLeadsWithEmails(batchId) {
        return this.leadModel.find({
            batch_id: batchId,
            extraction_status: "extracted",
            emails: { $exists: true, $ne: [] },
        });
    }
};
exports.BatchesService = BatchesService;
exports.BatchesService = BatchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(batches_schema_1.Batch.name)),
    __param(1, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(2, (0, mongoose_1.InjectModel)(plain_text_export_schema_1.PlainTextExport.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        google_service_1.GoogleService,
        chat_service_1.ChatService,
        utils_1.EmailPromptService])
], BatchesService);
//# sourceMappingURL=batches.service.js.map