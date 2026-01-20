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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const product_schema_1 = require("./schemas/product.schema");
const mongoose_2 = require("mongoose");
const embedding_1 = require("../../utils/embedding");
const text_utils_1 = require("../../utils/text-utils");
let ProductsService = class ProductsService {
    constructor(model) {
        this.model = model;
    }
    async search(query, user_id) {
        const normalizedTerms = (0, text_utils_1.expandWithSynonyms)((0, text_utils_1.normalizeText)(query));
        const products = await this.model.find({ user_id: user_id }).lean();
        const embedding = await (0, embedding_1.getEmbedding)(query);
        return products
            .map((product) => {
            const productTags = (product.tags || []).map((t) => t.toLowerCase());
            const productName = product.name?.toLowerCase() ?? "";
            const tagScore = normalizedTerms.reduce((score, term) => score +
                (productTags.some((tag) => tag.includes(term)) ? 1 : 0) +
                (productName.includes(term) ? 1 : 0), 0);
            const semScore = product.embedding?.length
                ? (0, embedding_1.cosineSimilarity)(embedding, product.embedding)
                : 0;
            return {
                name: product.name,
                score: tagScore,
                semanticScore: semScore,
            };
        })
            .filter((p) => p.score > 0 || p.semanticScore > 0.75)
            .sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0))
            .slice(0, 10);
    }
    async createMany(products) {
        const docs = await Promise.all(products.map(async (p) => {
            const embedding = await (0, embedding_1.getEmbedding)(p.name + " " + p.tags.join(" "));
            return { ...p, embedding };
        }));
        return this.model.insertMany(docs);
    }
    async create(product, user_id, assistant_id) {
        const embedding = await (0, embedding_1.getEmbedding)(product.name + " " + (product.tags ?? []).join(" "));
        const doc = new this.model({
            ...product,
            embedding,
            user_id,
            assistant_id,
        });
        return doc.save();
    }
    async findAll(user_id, assistant_id) {
        return this.model.find({ user_id, assistant_id }).lean();
    }
    async findOne(id) {
        return this.model.findById(id).lean();
    }
    async update(id, user_id, update) {
        const product = await this.model.findOne({ _id: id, user_id }).lean();
        if (!product) {
            throw new Error("Product not found or does not belong to user");
        }
        if (update.name || update.tags) {
            const name = update.name ?? product.name ?? "";
            const tags = update.tags ?? product.tags ?? [];
            update.embedding = await (0, embedding_1.getEmbedding)(name + " " + tags.join(" "));
        }
        return this.model
            .findOneAndUpdate({ _id: id, user_id }, update, { new: true })
            .lean();
    }
    async remove(id) {
        return this.model.findByIdAndDelete(id).lean();
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProductsService);
//# sourceMappingURL=products.service.js.map