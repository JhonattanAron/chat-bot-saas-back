import { Controller, Get, Param, Post, Delete, Body } from "@nestjs/common";
import { TelegramChatService } from "./telegram-chat.service";

@Controller("telegram-chat")
export class TelegramChatController {
  constructor(private readonly telegramChatService: TelegramChatService) {}

  @Post("webhook/:botToken")
  async handleWebhook(@Param("botToken") botToken: string, @Body() body: any) {
    try {
      const result = await this.telegramChatService.handleTelegramWebhook(
        body,
        botToken
      );
      return result;
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("start")
  async startTelegramChat(
    @Body()
    body: {
      userId: string;
      assistantId: string;
      telegramChatId: string;
      telegramUserId: string;
      message: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      messageId?: number;
    }
  ) {
    const {
      userId,
      assistantId,
      telegramChatId,
      telegramUserId,
      message,
      username,
      firstName,
      lastName,
      messageId,
    } = body;

    if (
      !userId ||
      !assistantId ||
      !telegramChatId ||
      !telegramUserId ||
      !message
    ) {
      return {
        success: false,
        error:
          "Missing required fields: userId, assistantId, telegramChatId, telegramUserId, and message are required",
        received: body,
      };
    }

    try {
      const chat = await this.telegramChatService.createTelegramChat(
        userId,
        assistantId,
        telegramChatId,
        telegramUserId,
        message,
        username,
        firstName,
        lastName,
        messageId
      );
      if (!chat) {
        return {
          success: false,
          error: "Failed to create Telegram chat",
        };
      }

      return {
        success: true,
        chat_id: chat._id,
        telegram_chat_id: telegramChatId,
        telegram_user_id: telegramUserId,
        user_id: userId,
        assistant_id: assistantId,
        message: "Telegram chat iniciado exitosamente",
        response:
          chat.messages[chat.messages.length - 1]?.content ||
          "No response generated",
        total_messages: chat.messages.length,
      };
    } catch (error) {
      console.error("Error starting Telegram chat:", error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Post("message")
  async sendMessage(
    @Body()
    body: {
      chatId: string;
      assistantId: string;
      role: "user" | "assistant";
      content: string;
      messageId?: number;
      messageType?: string;
      mediaUrl?: string;
      replyToMessageId?: number;
    }
  ) {
    const {
      chatId,
      assistantId,
      role,
      content,
      messageId,
      messageType,
      mediaUrl,
      replyToMessageId,
    } = body;

    if (!chatId || !assistantId || !role || !content) {
      return {
        success: false,
        error:
          "Missing required fields: chatId, assistantId, role, and content are required",
        received: body,
      };
    }

    try {
      const chat = await this.telegramChatService.addTelegramMessage(
        chatId,
        assistantId,
        role,
        content,
        messageId,
        messageType,
        mediaUrl,
        replyToMessageId
      );

      return {
        success: true,
        chat_id: chatId,
        assistant_id: assistantId,
        message: "Mensaje de Telegram enviado exitosamente",
        response:
          chat?.messages[chat.messages.length - 1]?.content ||
          "No response generated",
        total_messages: chat?.messages.length || 0,
      };
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Get(":chatId")
  async getTelegramChat(@Param("chatId") chatId: string) {
    try {
      const chat = await this.telegramChatService.getTelegramChat(chatId);

      if (!chat) {
        return {
          success: false,
          error: "Telegram chat not found",
        };
      }

      return {
        success: true,
        chat: {
          id: chat._id,
          userId: chat.userId,
          assistantId: chat.assistantId,
          telegramChatId: chat.telegramChatId,
          telegramUserId: chat.telegramUserId,
          username: chat.username,
          firstName: chat.firstName,
          lastName: chat.lastName,
          messages: chat.messages,
          lastActivity: chat.lastActivityAt,
          tokenUsage: {
            input: chat.input_tokens,
            output: chat.output_tokens,
          },
          telegramMetadata: chat.telegramMetadata,
        },
      };
    } catch (error) {
      console.error("Error getting Telegram chat:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("telegram/:telegramChatId")
  async getTelegramChatByTelegramId(
    @Param("telegramChatId") telegramChatId: string
  ) {
    try {
      const chat =
        await this.telegramChatService.getTelegramChatByTelegramId(
          telegramChatId
        );

      if (!chat) {
        return {
          success: false,
          error: "Telegram chat not found",
        };
      }

      return {
        success: true,
        chat: {
          id: chat._id,
          userId: chat.userId,
          assistantId: chat.assistantId,
          telegramChatId: chat.telegramChatId,
          telegramUserId: chat.telegramUserId,
          username: chat.username,
          firstName: chat.firstName,
          lastName: chat.lastName,
          messages: chat.messages,
          lastActivity: chat.lastActivityAt,
          tokenUsage: {
            input: chat.input_tokens,
            output: chat.output_tokens,
          },
        },
      };
    } catch (error) {
      console.error("Error getting Telegram chat by Telegram ID:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("user/:userId")
  async getUserTelegramChats(@Param("userId") userId: string) {
    try {
      const chats = await this.telegramChatService.getUserTelegramChats(userId);

      return {
        success: true,
        user_id: userId,
        total_chats: chats.length,
        chats: chats.map((chat) => ({
          id: chat._id,
          telegramChatId: chat.telegramChatId,
          telegramUserId: chat.telegramUserId,
          username: chat.username,
          firstName: chat.firstName,
          lastName: chat.lastName,
          lastActivity: chat.lastActivityAt,
          messageCount: chat.messages.length,
          lastMessage:
            chat.messages[chat.messages.length - 1]?.content?.substring(
              0,
              100
            ) + "..." || "No messages",
        })),
      };
    } catch (error) {
      console.error("Error getting user Telegram chats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("assistant/:assistantId")
  async getAssistantTelegramChats(@Param("assistantId") assistantId: string) {
    try {
      const chats =
        await this.telegramChatService.getAssistantTelegramChats(assistantId);

      return {
        success: true,
        assistant_id: assistantId,
        total_chats: chats.length,
        chats: chats.map((chat) => ({
          id: chat._id,
          telegramChatId: chat.telegramChatId,
          telegramUserId: chat.telegramUserId,
          username: chat.username,
          firstName: chat.firstName,
          lastName: chat.lastName,
          lastActivity: chat.lastActivityAt,
          messageCount: chat.messages.length,
          lastMessage:
            chat.messages[chat.messages.length - 1]?.content?.substring(
              0,
              100
            ) + "..." || "No messages",
        })),
      };
    } catch (error) {
      console.error("Error getting assistant Telegram chats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("test")
  async testEndpoint(@Body() body: any) {
    return {
      success: true,
      message: "Telegram chat controller is working",
      received_body: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Post("connect")
  async connectBot(
    @Body() body: { token: string; userId: string; assistantId: string }
  ) {
    const { token, userId, assistantId } = body;

    if (!token || !userId || !assistantId) {
      return {
        success: false,
        error:
          "Missing required fields: token, userId, and assistantId are required",
      };
    }

    try {
      const bot = await this.telegramChatService.connectBot(
        token,
        userId,
        assistantId
      );
      return {
        success: true,
        message: "Bot connected successfully",
        bot: {
          id: bot._id,
          botName: bot.botName,
          botUsername: bot.botUsername,
          botId: bot.botId,
          connectedAt: bot.connectedAt,
        },
      };
    } catch (error) {
      console.error("Error connecting bot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("bots")
  async getConnectedBots() {
    try {
      const bots = await this.telegramChatService.getConnectedBots();
      return {
        success: true,
        total_bots: bots.length,
        bots: bots.map((bot) => ({
          id: bot._id,
          botName: bot.botName,
          botUsername: bot.botUsername,
          botId: bot.botId,
          userId: bot.userId,
          assistantId: bot.assistantId,
          isActive: bot.isActive,
          connectedAt: bot.connectedAt,
          lastActivityAt: bot.lastActivityAt,
        })),
      };
    } catch (error) {
      console.error("Error getting connected bots:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("bots/user/:userId")
  async getUserBots(@Param("userId") userId: string) {
    try {
      const bots = await this.telegramChatService.getConnectedBots(userId);
      return {
        success: true,
        user_id: userId,
        total_bots: bots.length,
        bots: bots.map((bot) => ({
          id: bot._id,
          botName: bot.botName,
          botUsername: bot.botUsername,
          botId: bot.botId,
          assistantId: bot.assistantId,
          isActive: bot.isActive,
          connectedAt: bot.connectedAt,
          lastActivityAt: bot.lastActivityAt,
        })),
      };
    } catch (error) {
      console.error("Error getting user bots:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(":botId/send")
  async sendMessageWithBot(
    @Param("botId") botId: string,
    @Body() body: { chatId: string; message: string }
  ) {
    const { chatId, message } = body;

    if (!chatId || !message) {
      return {
        success: false,
        error: "Missing required fields: chatId and message are required",
      };
    }

    try {
      const result = await this.telegramChatService.sendMessageWithBot(
        botId,
        chatId,
        message
      );
      return {
        success: true,
        message: "Message sent successfully",
        result,
      };
    } catch (error) {
      console.error("Error sending message with bot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(":botId/disconnect")
  async disconnectBot(@Param("botId") botId: string) {
    try {
      const result = await this.telegramChatService.disconnectBot(botId);
      if (result) {
        return {
          success: true,
          message: "Bot disconnected successfully",
        };
      } else {
        return {
          success: false,
          error: "Bot not found or already disconnected",
        };
      }
    } catch (error) {
      console.error("Error disconnecting bot:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
