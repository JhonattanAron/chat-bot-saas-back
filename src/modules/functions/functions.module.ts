import { Module } from "@nestjs/common";
import { FunctionsService } from "./functions.service";
import { FunctionsController } from "./functions.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AssistantChat,
  AssistantChatSchema,
} from "../assistant-chats/assistant-chat.schema";
import { AssistantChatsModule } from "../assistant-chats/assistant-chats.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssistantChat.name, schema: AssistantChatSchema },
    ]),
    AssistantChatsModule,
  ],
  providers: [FunctionsService],
  controllers: [FunctionsController],
  exports: [FunctionsService],
})
export class FunctionsModule {}
