import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WhatsappService } from "./whatsapp.service";

@WebSocketGateway({ cors: true })
export class WhatsappGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly service: WhatsappService) {}

  @SubscribeMessage("start-session")
  async startSession(client: Socket, payload: { userId: string }) {
    await this.service.startSession(payload.userId, (qr) => {
      client.emit("qr", qr);
    });
  }
}
