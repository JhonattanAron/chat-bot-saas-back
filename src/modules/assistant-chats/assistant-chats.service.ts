import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AssistantChat, AssistantChatDocument } from "./assistant-chat.schema";
import { CreateAssistantDto } from "./create-assistant.dto";
import { FaqsService } from "../faqs/faqs.service";

@Injectable()
export class AssistantChatsService {
  constructor(
    @InjectModel(AssistantChat.name)
    private readonly model: Model<AssistantChatDocument>, // ✅ modelo inyectado
    private readonly faqsService: FaqsService, // ✅ servicio inyectado
  ) {}

  async createAssistant(body: CreateAssistantDto) {
    const assistantChat = new this.model(body);
    await assistantChat.save();
    return assistantChat;
  }

  async getAssistantById(assistantId: string, userId: string) {
    return this.model.findOne({ _id: assistantId, user_id: userId }).exec();
  }

  async getAssistantByIdAndFaqs(assistantId: string, userId: string) {
    const assistant_chat = await this.model
      .findOne({ _id: assistantId, user_id: userId })
      .exec();

    if (!assistant_chat) {
      throw new NotFoundException(
        `No se encontró el chat con assistant_id ${assistantId} para el usuario ${userId}`,
      );
    }

    const faqsDoc = await this.faqsService.getFaqs(userId, assistantId);
    const faqs = (faqsDoc?.faqs ?? []).map((f: any) => ({
      _id: f._id,
      question: f.question,
      answer: f.answer,
      category: f.category,
    }));

    return {
      ...assistant_chat.toObject(),
      faqs,
    };
  }

  async getAllAssistantsByUserId(userId: string) {
    return this.model.find({ user_id: userId }).exec();
  }

  async deleteAssistant(assistantId: string, userId: string) {
    const deleted = await this.model.findOneAndDelete({
      _id: assistantId,
      user_id: userId,
    });

    if (!deleted) {
      throw new NotFoundException("Assistant not found");
    }

    return deleted;
  }

  async updateAssistant(
    assistantId: string,
    userId: string,
    updateData: Partial<CreateAssistantDto>,
  ) {
    const updated = await this.model.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      updateData,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException("Assistant not found");
    }

    return updated;
  }
}
