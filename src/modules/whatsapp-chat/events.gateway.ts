import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "ws";

@WebSocketGateway({ path: "/ws/whatsapp" })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  emitToUser(userId: string, event: string, payload: any) {
    // naive implementation: broadcast with a simple protocol where clients send their userId on connect
    // In production, use a proper socket.io or map of clients
    try {
      const data = JSON.stringify({ event, payload, userId });
      this.server.clients.forEach((c: any) => {
        if (c.readyState === 1) c.send(data);
      });
    } catch (e) {
      // ignore
    }
  }
}
