import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Chat, ChatSchema } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { ChatCleanupService } from "../config/chat-cleanup.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import {
  Product,
  ProductSchema,
} from "src/modules/products/schemas/product.schema";
import {
  AssistantChat,
  AssistantChatSchema,
} from "src/modules/users/schemas/assistant-chat.schema";
import { UsersService } from "src/modules/users/users.service";
import { User, UserSchema } from "src/modules/users/schemas/UserSchema";
import { FaqsModule } from "src/modules/faqs/faqs.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: AssistantChat.name, schema: AssistantChatSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FaqsModule,
  ],
  providers: [
    ChatService,
    PromptGeneratorService,
    ChatCleanupService,
    PredictionService,
    ProductsService,
    UsersService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
