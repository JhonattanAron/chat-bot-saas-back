import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  InternalServerErrorException,
} from "@nestjs/common";
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
  // pseudo-controlador
  @Post("start-session")
  async startSession(@Body() body: { userId: string }) {
    const { userId } = body;

    try {
      // si ya hay socket en memoria
      if (this.service.isConnected(userId)) {
        return { qr: null, connected: true };
      }

      let qrCode: string | null = null;
      await this.service.startSession(userId, (qr) => {
        qrCode = qr;
      });

      // si se genera QR, no está conectado todavía
      return { qr: qrCode, connected: qrCode ? false : true };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        "Error al iniciar sesión WhatsApp",
      );
    }
  }
}
