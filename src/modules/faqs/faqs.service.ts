import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Faqs, FaqsDocument, FaqItem } from "./schema/faqs.schema";
import { expandWithSynonyms, normalizeText } from "src/utils/text-utils";
import { getEmbedding, cosineSimilarity } from "src/utils/embedding";

@Injectable()
export class FaqsService {
  constructor(@InjectModel(Faqs.name) private faqsModel: Model<FaqsDocument>) {}

  async createFaqs(data: {
    user_id: string;
    assistant_id: string;
    faqs: FaqItem[];
  }) {
    const faqsWithEmbeddings = await Promise.all(
      data.faqs.map(async (faq) => ({
        ...faq,
        embedding: await getEmbedding(faq.question),
      }))
    );

    return this.faqsModel.findOneAndUpdate(
      { user_id: data.user_id, assistant_id: data.assistant_id },
      { $push: { faqs: { $each: faqsWithEmbeddings } } },
      { new: true, upsert: true }
    );
  }

  async getFaqs(user_id: string, assistant_id: string) {
    const doc = await this.faqsModel.findOne({ user_id, assistant_id }).lean();
    if (!doc) return null;
    if (Array.isArray(doc.faqs)) {
      doc.faqs = doc.faqs.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      );
    }
    return doc;
  }

  async updateFaq(
    user_id: string,
    assistant_id: string,
    faqId: string,
    update: Partial<FaqItem>
  ) {
    // Si se actualiza la pregunta, también actualiza el embedding
    let embedding: number[] | undefined = undefined;
    if (update.question) {
      embedding = await getEmbedding(update.question);
    }

    const updateFields: any = {};
    if (update.question !== undefined)
      updateFields["faqs.$.question"] = update.question;
    if (update.answer !== undefined)
      updateFields["faqs.$.answer"] = update.answer;
    if (update.category !== undefined)
      updateFields["faqs.$.category"] = update.category;
    if (embedding !== undefined) updateFields["faqs.$.embedding"] = embedding;

    return this.faqsModel.findOneAndUpdate(
      { user_id, assistant_id, "faqs._id": faqId },
      { $set: updateFields },
      { new: true }
    );
  }

  async deleteFaq(user_id: string, assistant_id: string, faqId: string) {
    return this.faqsModel.findOneAndUpdate(
      { user_id, assistant_id },
      { $pull: { faqs: { _id: faqId } } },
      { new: true }
    );
  }

  async search(query: string, user_id: string, assistant_id: string) {
    const normalizedTerms = expandWithSynonyms(normalizeText(query));
    const faqsDoc = await this.faqsModel
      .findOne({ user_id, assistant_id })
      .lean();
    if (!faqsDoc || !faqsDoc.faqs) return [];

    const embedding = await getEmbedding(query);

    return faqsDoc.faqs
      .map((faq) => {
        const category = faq.category?.toLowerCase() ?? "";
        const question = faq.question?.toLowerCase() ?? "";

        const tagScore = normalizedTerms.reduce(
          (score, term) =>
            score +
            (category.includes(term) ? 1 : 0) +
            (question.includes(term) ? 1 : 0),
          0
        );

        const semScore = faq.embedding?.length
          ? cosineSimilarity(embedding, faq.embedding)
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
}
