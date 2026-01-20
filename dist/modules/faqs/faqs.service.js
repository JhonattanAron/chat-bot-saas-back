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
exports.FaqsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const faqs_schema_1 = require("./schema/faqs.schema");
const text_utils_1 = require("../../utils/text-utils");
const embedding_1 = require("../../utils/embedding");
let FaqsService = class FaqsService {
    constructor(faqsModel) {
        this.faqsModel = faqsModel;
    }
    async createFaqs(data) {
        const faqsWithEmbeddings = await Promise.all(data.faqs.map(async (faq) => ({
            ...faq,
            embedding: await (0, embedding_1.getEmbedding)(faq.question),
        })));
        return this.faqsModel.findOneAndUpdate({ user_id: data.user_id, assistant_id: data.assistant_id }, { $push: { faqs: { $each: faqsWithEmbeddings } } }, { new: true, upsert: true });
    }
    async getFaqs(user_id, assistant_id) {
        const doc = await this.faqsModel.findOne({ user_id, assistant_id }).lean();
        if (!doc)
            return null;
        if (Array.isArray(doc.faqs)) {
            doc.faqs = doc.faqs.sort((a, b) => new Date(b.createdAt ?? 0).getTime() -
                new Date(a.createdAt ?? 0).getTime());
        }
        return doc;
    }
    async updateFaq(user_id, assistant_id, faqId, update) {
        let embedding = undefined;
        if (update.question) {
            embedding = await (0, embedding_1.getEmbedding)(update.question);
        }
        const updateFields = {};
        if (update.question !== undefined)
            updateFields["faqs.$.question"] = update.question;
        if (update.answer !== undefined)
            updateFields["faqs.$.answer"] = update.answer;
        if (update.category !== undefined)
            updateFields["faqs.$.category"] = update.category;
        if (embedding !== undefined)
            updateFields["faqs.$.embedding"] = embedding;
        return this.faqsModel.findOneAndUpdate({ user_id, assistant_id, "faqs._id": faqId }, { $set: updateFields }, { new: true });
    }
    async deleteFaq(user_id, assistant_id, faqId) {
        return this.faqsModel.findOneAndUpdate({ user_id, assistant_id }, { $pull: { faqs: { _id: faqId } } }, { new: true });
    }
    async search(query, user_id, assistant_id) {
        const normalizedTerms = (0, text_utils_1.expandWithSynonyms)((0, text_utils_1.normalizeText)(query));
        const faqsDoc = await this.faqsModel
            .findOne({ user_id, assistant_id })
            .lean();
        if (!faqsDoc || !faqsDoc.faqs)
            return [];
        const embedding = await (0, embedding_1.getEmbedding)(query);
        return faqsDoc.faqs
            .map((faq) => {
            const category = faq.category?.toLowerCase() ?? "";
            const question = faq.question?.toLowerCase() ?? "";
            const tagScore = normalizedTerms.reduce((score, term) => score +
                (category.includes(term) ? 1 : 0) +
                (question.includes(term) ? 1 : 0), 0);
            const semScore = faq.embedding?.length
                ? (0, embedding_1.cosineSimilarity)(embedding, faq.embedding)
                : 0;
            return {
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                score: tagScore,
                semanticScore: semScore,
            };
        })
            .filter((f) => f.score > 0 || f.semanticScore > 0.75)
            .sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0))
            .slice(0, 10);
    }
};
exports.FaqsService = FaqsService;
exports.FaqsService = FaqsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(faqs_schema_1.Faqs.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FaqsService);
//# sourceMappingURL=faqs.service.js.map