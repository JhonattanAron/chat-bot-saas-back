import { Injectable, Type } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ChatDocument } from "../chat-model/schemas/chat.schema";
import { AssistantChatDocument } from "../users/schemas/assistant-chat.schema";
import { DashboardStatsDocument } from "./dashboard-stats.schema";

import { TelegramChatDocument } from "../telegram-chat/schemas/telegram-chat.schema";
import { Chat } from "../chat-model/schemas/chat.schema";
import { AssistantChat } from "../users/schemas/assistant-chat.schema";
import { DashboardStats } from "./dashboard-stats.schema";
import { User } from "../users/schemas/UserSchema";

import { TelegramChat } from "../telegram-chat/schemas/telegram-chat.schema";
import type {
  DashboardStatsResponse,
  TokenUsage,
  Bot,
} from "./dto/update-dashboard-stats.dto";

@Injectable()
export class DashboardService {
  @InjectModel(Chat.name)
  private chatModel: Model<ChatDocument>;

  @InjectModel(AssistantChat.name)
  private assistantChatModel: Model<AssistantChatDocument>;

  @InjectModel(User.name)
  private userModel: Model<User>;

  @InjectModel(DashboardStats.name)
  private dashboardStatsModel: Model<DashboardStatsDocument>;

  @InjectModel(TelegramChat.name)
  private telegramChatModel: Model<TelegramChatDocument>;

  constructor() {}

  async syncCurrentStats(userId: string): Promise<void> {
    let stats = await this.dashboardStatsModel.findOne({ user_id: userId });

    if (!stats) {
      stats = await this.dashboardStatsModel.create({
        user_id: userId,
        total_bots_created: 0,
        active_bots: 0,
        total_messages: 0,
        monthly_messages: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        monthly_input_tokens: 0,
        monthly_output_tokens: 0,
        total_conversations: 0,
        monthly_conversations: 0,
        counted_chats: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const webChats = await this.chatModel.find({ userId });
    const telegramChats = await this.telegramChatModel.find({ userId });

    if (!webChats?.length && !telegramChats?.length) return;

    const allChats = [
      ...webChats.map((chat) => ({
        ...chat.toObject(),
        platform: "web",
        id: (chat._id as Types.ObjectId).toString(),
      })),
      ...telegramChats.map((chat) => ({
        ...chat.toObject(),
        platform: "telegram",
        id: (chat._id as Types.ObjectId).toString(),
      })),
    ];

    let inputSum = 0;
    let outputSum = 0;
    let messagesSum = 0;
    let newConversations = 0;

    for (const chat of allChats) {
      const counted = stats.counted_chats.find((c) => c.chat_id === chat.id);

      const newInput = chat.input_tokens - (counted?.last_input_tokens || 0);
      const newOutput = chat.output_tokens - (counted?.last_output_tokens || 0);

      if (newInput > 0 || newOutput > 0) {
        inputSum += newInput;
        outputSum += newOutput;
        messagesSum += chat.messages?.length || 0;

        if (counted) {
          counted.last_input_tokens = chat.input_tokens;
          counted.last_output_tokens = chat.output_tokens;
        } else {
          stats.counted_chats.push({
            chat_id: chat.id,
            last_input_tokens: chat.input_tokens,
            last_output_tokens: chat.output_tokens,
          });
          newConversations += 1;
        }
      }
    }

    if (
      inputSum > 0 ||
      outputSum > 0 ||
      messagesSum > 0 ||
      newConversations > 0
    ) {
      await this.dashboardStatsModel.updateOne(
        { user_id: userId },
        {
          $inc: {
            total_input_tokens: inputSum,
            total_output_tokens: outputSum,
            monthly_input_tokens: inputSum,
            monthly_output_tokens: outputSum,
            total_messages: messagesSum,
            monthly_messages: messagesSum,
            total_conversations: newConversations,
            monthly_conversations: newConversations,
          },
          $set: {
            counted_chats: stats.counted_chats,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  async incrementBotCreated(userId: string): Promise<void> {
    await this.dashboardStatsModel.updateOne(
      { user_id: userId },
      {
        $inc: { total_bots_created: 1, active_bots: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }

  async getDashboardStats(userId: string): Promise<DashboardStatsResponse> {
    await this.syncCurrentStats(userId);
    const stats = await this.dashboardStatsModel.findOne({ user_id: userId });

    const activeBots = stats?.active_bots || 0;
    const totalMessages = stats?.total_messages || 0;
    const totalConversations = stats?.total_conversations || 0;

    return {
      total_bots: activeBots,
      total_messages: totalMessages,
      active_users: totalConversations,
      conversion_rate:
        activeBots > 0
          ? Math.round((totalMessages / activeBots) * 100) / 100
          : 0,
      bots_change: `+0 desde el mes pasado`,
      messages_change: `+0 desde el mes pasado`,
      users_change: `+0 desde el mes pasado`,
      conversion_change: `+0% desde el mes pasado`,
    };
  }

  async getTokenUsage(userId: string): Promise<TokenUsage> {
    await this.syncCurrentStats(userId);
    const stats = await this.dashboardStatsModel.findOne({ user_id: userId });

    console.log(stats);

    const maxTokens = 10000;
    const inputTokens = stats?.total_input_tokens || 0;
    const outputTokens = stats?.total_output_tokens || 0;
    const totalUsed = inputTokens + outputTokens;

    return {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      max_tokens: maxTokens,
      usage_percentage: Math.round((totalUsed / maxTokens) * 100),
    };
  }

  async getUserBots(userId: string): Promise<Bot[]> {
    const assistants = await this.assistantChatModel
      .find({ user_id: userId })
      .exec();

    return assistants.map((assistant) => ({
      id: assistant.id.toString(),
      name: assistant.name,
      status: assistant.status as "online" | "offline" | "maintenance",
      messages_count: assistant.all_messages || 0,
      created_at: assistant.createdAt.toISOString(),
      updated_at: assistant.updatedAt.toISOString(),
    }));
  }

  async getAnalytics(userId: string) {
    const stats = await this.dashboardStatsModel.findOne({ user_id: userId });
    const bots = await this.getUserBots(userId);

    const botPerformance = bots.map((bot) => ({
      bot_name: bot.name,
      messages: bot.messages_count,
      success_rate: 85 + Math.floor(Math.random() * 15),
    }));

    return {
      daily_messages: [],
      bot_performance: botPerformance,
    };
  }

  async addTokenUsage(
    userId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    await this.dashboardStatsModel.updateOne(
      { user_id: userId },
      {
        $inc: {
          total_input_tokens: inputTokens,
          total_output_tokens: outputTokens,
          monthly_input_tokens: inputTokens,
          monthly_output_tokens: outputTokens,
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }
}
