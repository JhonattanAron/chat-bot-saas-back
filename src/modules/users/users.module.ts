import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AssistantChat,
  AssistantChatSchema,
} from "./schemas/assistant-chat.schema";
import { User, UserSchema } from "./schemas/UserSchema";
import { Faqs, FaqsSchema } from "../faqs/schema/faqs.schema";
import { FaqsModule } from "../faqs/faqs.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssistantChat.name, schema: AssistantChatSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Faqs.name, schema: FaqsSchema }]),
    FaqsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
