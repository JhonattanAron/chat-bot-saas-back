import { Module } from "@nestjs/common";
import { WhatsappController } from "./whatsapp.controller";
import { EventsGateway } from "./events.gateway";
import { SessionsService } from "./sessions.service";
import { WhatsappService } from "./whatsapp.service";

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, SessionsService, EventsGateway],
  exports: [WhatsappService],
})
export class WhatsappModule {}
