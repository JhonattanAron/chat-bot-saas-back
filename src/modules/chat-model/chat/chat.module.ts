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
  ProductAssistan,
  ProductSchema,
} from "src/modules/products/schemas/product-assistant.schema";
import {
  AssistantChat,
  AssistantChatSchema,
} from "src/modules/assistant-chats/assistant-chat.schema";
import { UsersService } from "src/modules/users/users.service";
import { User, UserSchema } from "src/modules/users/schemas/UserSchema";
import { FaqsModule } from "src/modules/faqs/faqs.module";
import { CustomFunctionService } from "../services/custom-function.service";
import { PlansModule } from "src/modules/plans/plans.module";
import {
  StickReferences,
  StickReferencesSchema,
} from "src/modules/plans/stick-references.schema";
import { DashboardModule } from "src/modules/dashboard/dashboard.module";
import { PredictionLargueService } from "../model-ai/predictionlargue.service";
import { FunctionRouterService } from "../model-ai/function-router.service";
import { MemoryManagerService } from "../model-ai/memory-manager.service";
import { FaqsService } from "src/modules/faqs/faqs.service";
import { Faqs, FaqsSchema } from "src/modules/faqs/schema/faqs.schema";
import { AssistantChatsModule } from "src/modules/assistant-chats/assistant-chats.module";
import { AssistantChatsService } from "src/modules/assistant-chats/assistant-chats.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MongooseModule.forFeature([
      { name: ProductAssistan.name, schema: ProductSchema },
    ]),
    MongooseModule.forFeature([
      { name: AssistantChat.name, schema: AssistantChatSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: StickReferences.name, schema: StickReferencesSchema },
    ]),
    MongooseModule.forFeature([{ name: Faqs.name, schema: FaqsSchema }]),
    FaqsModule,
    PlansModule,
    DashboardModule,
    AssistantChatsModule,
  ],
  providers: [
    ChatService,
    PromptGeneratorService,
    PredictionLargueService,
    ChatCleanupService,
    PredictionService,
    ProductsService,
    UsersService,
    CustomFunctionService,
    FunctionRouterService,
    MemoryManagerService,
    FaqsService,
    AssistantChatsService,
  ],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
