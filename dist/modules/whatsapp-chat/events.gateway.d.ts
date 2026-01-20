import { Server } from "ws";
export declare class EventsGateway {
    server: Server;
    emitToUser(userId: string, event: string, payload: any): void;
}
