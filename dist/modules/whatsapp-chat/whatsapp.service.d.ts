import { OnModuleDestroy } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { EventsGateway } from "./events.gateway";
export declare class WhatsappService implements OnModuleDestroy {
    private sessions;
    private events;
    private readonly logger;
    private clients;
    private qrCache;
    constructor(sessions: SessionsService, events: EventsGateway);
    initSession(userId: string): Promise<{
        ok: boolean;
    }>;
    generateQr(userId: string): Promise<{
        ok: boolean;
    }>;
    sendMessage(userId: string, to: string, text: string): Promise<import("@adiwajshing/baileys").proto.WebMessageInfo | undefined>;
    getStatus(userId: string): Promise<{
        connected: boolean;
    }>;
    getQr(userId: string): string | null;
    onModuleDestroy(): void;
}
