import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { TelegramChatService } from "./telegram-chat.service"
import { TelegramChatController } from "./telegram-chat.controller"
import { TelegramChat, TelegramChatSchema } from "./schemas/telegram-chat.schema"
import { TelegramBot, TelegramBotSchema } from "./schemas/telegram-bot.schema"
import { PromptGeneratorService } from "../chat-model/config/prompt-generator.service"
import { PredictionService } from "../chat-model/model-ai/predictions.service"
import { ProductsService } from "../products/products.service"
import { Product, ProductSchema } from "../products/schemas/product.schema"
import { AssistantChat, AssistantChatSchema } from "../users/schemas/assistant-chat.schema"
import { UsersService } from "../users/users.service"
import { User, UserSchema } from "../users/schemas/UserSchema"
import { FaqsModule } from "../faqs/faqs.module"
import { CustomFunctionService } from "../chat-model/services/custom-function.service"
import { PlansModule } from "../plans/plans.module"
import { StickReferences, StickReferencesSchema } from "../plans/stick-references.schema"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TelegramChat.name, schema: TelegramChatSchema }]),
    MongooseModule.forFeature([{ name: TelegramBot.name, schema: TelegramBotSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: AssistantChat.name, schema: AssistantChatSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: StickReferences.name, schema: StickReferencesSchema }]),
    FaqsModule,
    PlansModule,
  ],
  providers: [
    TelegramChatService,
    PromptGeneratorService,
    PredictionService,
    ProductsService,
    UsersService,
    CustomFunctionService,
  ],
  controllers: [TelegramChatController],
  exports: [TelegramChatService],
})
export class TelegramChatModule {}
