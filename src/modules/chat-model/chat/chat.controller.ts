import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProxyAuthGuard } from "src/modules/auth/proxy-auth.guard";

// chat.controller.ts
@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly predictService: PredictionService,
  ) {}

  @UseGuards(ProxyAuthGuard)
  @Post("start")
  async startChat(
    @Body()
    body: {
      assistant_id: string;
      prompt: string;
    },
    @Req() req?: any,
  ) {
    const { assistant_id, prompt } = body;
    const user_id = req?.user?.id;

    if (!assistant_id || !prompt) {
      return {
        success: false,
        error: "Missing required fields: assistant_id, and prompt are required",
        received: body,
      };
    }

    try {
      const chat = await this.chatService.createChat(
        user_id,
        assistant_id,
        prompt,
      );

      return {
        success: true,
        chat_id: chat._id,
        user_id: user_id,
        assistant_id,
        message: "Chat iniciado exitosamente",
        response:
          chat.messages[chat.messages.length - 1]?.content ||
          "No response generated",
        total_messages: chat.messages.length,
      };
    } catch (error) {
      console.error("Error starting chat:", error);
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
      assistant_id: string;
      role: "user" | "assistant";
      content: string;
    },
  ) {
    const { chatId, assistant_id, role, content } = body;

    if (!chatId || !assistant_id || !role || !content) {
      return {
        success: false,
        error:
          "Missing required fields: chatId, assistant_id, role, and content are required",
        received: body,
      };
    }

    try {
      const chat = await this.chatService.addMessage(
        chatId,
        assistant_id,
        role,
        content,
      );

      return {
        success: true,
        chat_id: chatId,
        assistant_id,
        message: "Mensaje enviado exitosamente",
        response:
          chat?.messages[chat.messages.length - 1]?.content ||
          "No response generated",
        total_messages: chat?.messages.length || 0,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Get(":chatId")
  async getChat(@Param("chatId") chatId: string) {
    try {
      const chat = await this.chatService.getChat(chatId);

      if (!chat) {
        return {
          success: false,
          error: "Chat not found",
        };
      }

      return {
        success: true,
        chat: {
          id: chat._id,
          userId: chat.userId,
          messages: chat.messages,
          lastActivity: chat.lastActivityAt,
          tokenUsage: {
            input: chat.input_tokens,
            output: chat.output_tokens,
          },
        },
      };
    } catch (error) {
      console.error("Error getting chat:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @UseGuards(ProxyAuthGuard)
  @Get("get/user")
  async getUserChats(@Req() req: any) {
    try {
      const userId = req?.user?.id;
      const chats = await this.chatService.getUserChats(userId);

      return {
        success: true,
        user_id: userId,
        total_chats: chats.length,
        chats: chats.map((chat) => ({
          id: chat._id,
          lastActivity: chat.lastActivityAt,
          messageCount: chat.messages.length,
          lastMessage:
            chat.messages[chat.messages.length - 1]?.content?.substring(
              0,
              100,
            ) + "..." || "No messages",
        })),
      };
    } catch (error) {
      console.error("Error getting user chats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("model/predict")
  async Predict(body: { userId: string; prompt: string }) {
    const predict = await this.chatService.predict(body.userId, body.prompt);
    return { predict };
  }

  // Endpoint de prueba para verificar que el controlador funciona
  @Post("test")
  async testEndpoint(body: any) {
    return {
      success: true,
      message: "Chat controller is working",
      received_body: body,
      timestamp: new Date().toISOString(),
    };
  }
}
