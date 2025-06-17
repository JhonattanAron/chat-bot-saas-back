import { Controller, Post, Body } from "@nestjs/common";
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
}
