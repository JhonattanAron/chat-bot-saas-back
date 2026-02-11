import { Module } from "@nestjs/common";
import { AssistantChatsService } from "./assistant-chats.service";
import { AssistantChatsController } from "./assistant-chats.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { AssistantChat, AssistantChatSchema } from "./assistant-chat.schema";
import { FaqsModule } from "../faqs/faqs.module";
import { Faqs, FaqsSchema } from "../faqs/schema/faqs.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssistantChat.name, schema: AssistantChatSchema },
    ]),
    MongooseModule.forFeature([
      {
        name: Faqs.name,
        schema: FaqsSchema,
      },
    ]),

    FaqsModule,
  ],
  providers: [AssistantChatsService],
  controllers: [AssistantChatsController],
  exports: [AssistantChatsService],
})
export class AssistantChatsModule {}
