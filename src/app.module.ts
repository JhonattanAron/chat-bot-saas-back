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
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { TelegramChatModule } from "./modules/telegram-chat/telegram-chat.module";
import { PlansModule } from "./modules/plans/plans.module";
import { BatchesModule } from "./modules/batches/batches.module";
import { SystemModule } from "./modules/system/system.module";
import { MailModule } from "./modules/ai-emails/mail.module";
import { CampaignsModule } from "./modules/automated-tasks/campaign-automated/campaign-automated.module";
import { WebChatConfigModule } from "./modules/skd-web/web-chat-config.module";
import { GoogleMapsModule } from "./modules/google-maps-leads/google-maps.module";
import { WhatsappModule } from "./modules/whastAppQr/whatsapp.module";
import { CrmModule } from "./modules/crm/crm.module";
import { FunctionsModule } from "./modules/functions/functions.module";
import { AssistantChatsModule } from "./modules/assistant-chats/assistant-chats.module";
import { ScrapersModule } from "./modules/scrapers/scrapers.module";
import { MailModuleCorporative } from "./modules/mail/mail.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { VpsModule } from "./modules/vps/vps.module";
import { ContaboModule } from "./modules/contabo/contabo.module";
import { CatalogModule } from "./modules/services/catalog/catalog.module";
import { CartModule } from "./modules/services/cart/cart.module";

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
    DashboardModule,
    WebChatConfigModule,
    PlansModule,
    MailModule,
    BatchesModule,
    SystemModule,
    CampaignsModule,
    GoogleMapsModule,
    WhatsappModule,
    ScrapersModule,
    CrmModule,
    FunctionsModule,
    AssistantChatsModule,
    MailModuleCorporative,
    InvoicesModule,
    VpsModule,
    ContaboModule,
    CatalogModule,
    CartModule,
  ],
  controllers: [AppController, SessionController],
  providers: [AppService],
})
export class AppModule {}
