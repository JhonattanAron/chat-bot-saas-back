import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
// chat.controller.ts
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("start")
  async startChat(
    @Body() body: { userId: string; assistant_id: string; promt: string }
  ) {
    const { userId, assistant_id, promt } = body;

    if (!userId || !assistant_id || !promt) {
      return {
        success: false,
        error:
          "Missing required fields: userId, assistant_id, and promt are required",
        received: body,
      };
    }

    try {
      const chat = await this.chatService.createChat(
        userId,
        assistant_id,
        promt
      );

      return {
        success: true,
        chat_id: chat._id,
        user_id: userId,
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
    }
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
        content
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

  @Get("user/:userId")
  async getUserChats(@Param("userId") userId: string) {
    try {
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
              100
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
