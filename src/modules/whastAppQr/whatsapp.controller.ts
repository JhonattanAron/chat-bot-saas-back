import { Controller, Post, Body, Query, Get } from "@nestjs/common";
import { WhatsappService } from "./whatsapp.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { SendBulkDto } from "./dto/send-bulk.dto";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Post("send")
  send(@Body() dto: SendMessageDto) {
    return this.service.sendMessage(dto.userId, dto.phone, dto.message);
  }

  @Post("bulk")
  sendBulk(@Body() dto: SendBulkDto) {
    return this.service.sendBulk(dto.userId, dto.phones, dto.message);
  }
  @Get("session-status")
  getSessionStatus(@Query("userId") userId: string) {
    const session = this.service.getSession(userId);
    return { connected: !!session }; // true si la sesión existe
  }
  @Post("start-session")
  async startSession(@Body() body: { userId: string }) {
    const { userId } = body;

    return new Promise<{ qr: string }>((resolve, reject) => {
      try {
        this.service.startSession(userId, (qr) => {
          resolve({ qr });
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
