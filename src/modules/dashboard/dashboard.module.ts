import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { Chat, ChatSchema } from "../chat-model/schemas/chat.schema";
import {
  AssistantChat,
  AssistantChatSchema,
} from "../users/schemas/assistant-chat.schema";
import { User, UserSchema } from "../users/schemas/UserSchema";
import { DashboardStats, DashboardStatsSchema } from "./dashboard-stats.schema";

import {
  TelegramChat,
  TelegramChatSchema,
} from "../telegram-chat/schemas/telegram-chat.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: AssistantChat.name, schema: AssistantChatSchema },
      { name: User.name, schema: UserSchema },
      { name: DashboardStats.name, schema: DashboardStatsSchema },
      { name: TelegramChat.name, schema: TelegramChatSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
