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
  private sessionState = new Map<
    string,
    { qr?: string | null; connected?: boolean }
  >();

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
    const session = this.service.getSessionState(userId);
    return { connected: !!session }; // true si la sesión existe
  }
  @Get("session-state")
  getSessionState(@Query("userId") userId: string) {
    return (
      this.sessionState.get(userId) ?? {
        qr: null,
        connected: this.service.isConnected(userId),
      }
    );
  }

  // pseudo-controlador

  @Post("start-session")
  startSession(@Body() body: { userId: string }) {
    const { userId } = body;

    if (this.service.isConnected(userId)) {
      this.sessionState.set(userId, { qr: null, connected: true });
      return { status: "already_connected" };
    }

    this.service.startSession(userId, (data) => {
      this.sessionState.set(userId, data);
    });

    return { status: "started" };
  }
}
