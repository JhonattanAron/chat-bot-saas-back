import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
// chat.controller.ts
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("start")
  async startChat(
    @Body("userId") userId: string,
    @Body("promt") prompt: string
  ) {
    return this.chatService.createChat(userId, prompt);
  }

  @Post("message")
  async sendMessage(
    @Body("chatId") chatId: string,
    @Body("role") role: "user" | "assistant",
    @Body("content") content: string
  ) {
    return this.chatService.addMessage(chatId, role, content);
  }

  @Get(":chatId")
  async getChat(@Param("chatId") chatId: string) {
    return this.chatService.getChat(chatId);
  }
}
