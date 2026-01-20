import { WhatsappService } from "./whatsapp.service";
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    connect(userId: string): Promise<{
        ok: boolean;
    }>;
    getQr(userId: string): Promise<{
        qr: string | null;
        ready: boolean;
    }>;
    sendMessage(userId: string, body: {
        to: string;
        text: string;
    }): Promise<import("@adiwajshing/baileys").proto.WebMessageInfo | undefined>;
    getStatus(userId: string): Promise<{
        connected: boolean;
    }>;
}
