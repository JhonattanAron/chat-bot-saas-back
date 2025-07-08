import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AssistantChat } from "./schemas/assistant-chat.schema";
import { CreateAssistantDto } from "./schemas/create-asistantdto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("assistant-chat")
  createAssistantChat(@Body() body: CreateAssistantDto) {
    return this.usersService.createAssistantChatData(body);
  }
  @Get("assistant-chats")
  async getAllAssistantChats(@Query("user_id") user_id: string) {
    return this.usersService.getAllAssistantChatsByUserId(user_id);
  }
  @Get("assistant-chat")
  async getAssistantChat(
    @Query("id") id: string,
    @Query("user_id") user_id: string
  ) {
    return this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(
      id,
      user_id
    );
  }
}
