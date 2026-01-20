// mail.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailLog, MailLogSchema } from "./schemas/mail-log.schema";
import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";
import { ChatModule } from "../chat-model/chat/chat.module";
import { MailTemplateService } from "./services/mail-template.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MailLog.name, schema: MailLogSchema }]),
    ChatModule, // Importa ChatModule que exporta ChatService
  ],
  controllers: [MailController],
  providers: [MailService, MailTemplateService], // Solo tu servicio propio aquí
  exports: [MailService],
})
export class MailModule {}
