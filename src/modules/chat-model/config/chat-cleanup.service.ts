import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Chat, ChatDocument } from "../schemas/chat.schema";
import { Cron } from "@nestjs/schedule";

// chat-cleanup.service.ts
@Injectable()
export class ChatCleanupService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  @Cron("*/10 * * * *") // Cada 10 minutos
  async handleCleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await this.chatModel.deleteMany({ lastActivityAt: { $lt: oneHourAgo } });
  }
}
