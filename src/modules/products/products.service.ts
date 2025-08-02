// src/products/products.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { Model } from "mongoose";
import { getEmbedding, cosineSimilarity } from "../../utils/embedding";
import { normalizeText, expandWithSynonyms } from "../../utils/text-utils";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private model: Model<ProductDocument>
  ) {}

  async search(query: string, user_id: string) {
    const normalizedTerms = expandWithSynonyms(normalizeText(query));
    const products = await this.model.find({ user_id: user_id }).lean();
    const embedding = await getEmbedding(query);

    return products
      .map((product) => {
        const productTags = (product.tags || []).map((t: string) =>
          t.toLowerCase()
        );
        const productName = product.name?.toLowerCase() ?? "";

        const tagScore = normalizedTerms.reduce(
          (score, term) =>
            score +
            (productTags.some((tag) => tag.includes(term)) ? 1 : 0) +
            (productName.includes(term) ? 1 : 0),
          0
        );

        const semScore = product.embedding?.length
          ? cosineSimilarity(embedding, product.embedding)
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
  async createMany(products: CreateProductDto[]) {
    const docs = await Promise.all(
      products.map(async (p) => {
        const embedding = await getEmbedding(p.name + " " + p.tags.join(" "));
        return { ...p, embedding };
      })
    );

    return this.model.insertMany(docs);
  }

  async create(
    product: CreateProductDto,
    user_id: string,
    assistant_id: string
  ) {
    const embedding = await getEmbedding(
      product.name + " " + (product.tags ?? []).join(" ")
    );
    const doc = new this.model({
      ...product,
      embedding,
      user_id,
      assistant_id,
    });
    return doc.save();
  }

  async findAll(user_id: string, assistant_id: string) {
    return this.model.find({ user_id, assistant_id }).lean();
  }

  async findOne(id: string) {
    return this.model.findById(id).lean();
  }

  async update(
    id: string,
    user_id: string,
    update: Partial<CreateProductDto> & { embedding?: number[] }
  ) {
    const product = await this.model.findOne({ _id: id, user_id }).lean();
    if (!product) {
      throw new Error("Product not found or does not belong to user");
    }
    if (update.name || update.tags) {
      const name = update.name ?? product.name ?? "";
      const tags = update.tags ?? product.tags ?? [];
      update.embedding = await getEmbedding(name + " " + tags.join(" "));
    }
    return this.model
      .findOneAndUpdate({ _id: id, user_id }, update, { new: true })
      .lean();
  }

  async remove(id: string) {
    return this.model.findByIdAndDelete(id).lean();
  }
}
