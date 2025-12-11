import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SessionController } from "./modules/session/session.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsModule } from "./modules/products/products.module";
import { ChatModule } from "./modules/chat-model/chat/chat.module";
import { ScheduleModule } from "@nestjs/schedule";

import { UsersModule } from "./modules/users/users.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { FaqsModule } from "./modules/faqs/faqs.module";
import { ApiKeyValidateModule } from "./modules/api-key-validate/api-key-validate.module";
import { AutomatedTasksModule } from "./modules/automated-tasks/automated-tasks.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { TelegramChatModule } from "./modules/telegram-chat/telegram-chat.module";
import { PlansModule } from "./modules/plans/plans.module";
import { WhatsappModule } from "./modules/whatsapp-chat/whatsapp.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL || ""),
    ProductsModule,
    ChatModule,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    FaqsModule,
    ApiKeyValidateModule,
    AutomatedTasksModule,
    DashboardModule,
    TelegramChatModule,
    PlansModule,
    WhatsappModule,
  ],
  controllers: [AppController, SessionController],
  providers: [AppService],
})
export class AppModule {}
