import { Controller, Get, Param, Post, Delete, Body } from "@nestjs/common";
import { TelegramChatService } from "./telegram-chat.service";

@Controller("telegram-chat")
export class TelegramChatController {
  constructor(private readonly telegramChatService: TelegramChatService) {}

  // ================= WEBHOOK =================

  @Post("webhook/:botToken")
  async handleWebhook(@Param("botToken") botToken: string, @Body() body: any) {
    return this.telegramChatService.handleTelegramWebhook(body, botToken);
  }

  // ================= BOTS =================

  @Post("connect")
  async connectBot(
    @Body()
    body: {
      token: string;
      userId: string;
      assistantId: string;
    },
  ) {
    const { token, userId, assistantId } = body;
    return this.telegramChatService.connectBot(token, userId, assistantId);
  }

  @Delete(":botId/disconnect")
  async disconnectBot(@Param("botId") botId: string) {
    return this.telegramChatService.disconnectBot(botId);
  }

  @Get("bots")
  async getConnectedBots() {
    return this.telegramChatService.getConnectedBots();
  }

  @Get("bots/user/:userId")
  async getUserBots(@Param("userId") userId: string) {
    return this.telegramChatService.getConnectedBots(userId);
  }

  @Post(":botId/send")
  async sendMessageWithBot(
    @Param("botId") botId: string,
    @Body() body: { chatId: string; message: string },
  ) {
    return this.telegramChatService.sendMessageWithBot(
      botId,
      body.chatId,
      body.message,
    );
  }

  // ================= CHATS =================

  @Get(":chatId")
  async getTelegramChat(@Param("chatId") chatId: string) {
    return this.telegramChatService.getTelegramChat(chatId);
  }

  @Get("telegram/:telegramChatId")
  async getTelegramChatByTelegramId(
    @Param("telegramChatId") telegramChatId: string,
  ) {
    return this.telegramChatService.getTelegramChatByTelegramId(telegramChatId);
  }

  @Get("user/:userId")
  async getUserTelegramChats(@Param("userId") userId: string) {
    return this.telegramChatService.getUserTelegramChats(userId);
  }

  @Get("assistant/:assistantId")
  async getAssistantTelegramChats(@Param("assistantId") assistantId: string) {
    return this.telegramChatService.getAssistantTelegramChats(assistantId);
  }

  // ================= HEALTH =================

  @Post("test")
  test() {
    return {
      ok: true,
      service: "telegram-chat",
      timestamp: new Date().toISOString(),
    };
  }
}
