import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "@adiwajshing/baileys";
import { SessionsService } from "./sessions.service";
import { EventsGateway } from "./events.gateway";

@Injectable()
export class WhatsappService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private clients: Map<string, WASocket> = new Map();

  // Cache para guardar QR por usuario
  private qrCache: Map<string, string> = new Map();

  constructor(
    private sessions: SessionsService,
    private events: EventsGateway
  ) {}

  async initSession(userId: string) {
    // Cargar credenciales guardadas si existen
    const saved = this.sessions.loadSession(userId);

    // Obtener versión más reciente de Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    this.logger.log(
      `Baileys version ${version.join(".")} (latest: ${isLatest})`
    );

    // Usar multi-file auth state
    const { state, saveCreds } = await useMultiFileAuthState(
      `./whatsapp_auth_${userId}`
    );

    const sock = makeWASocket({ version, auth: state });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update as any;

      if (qr) {
        this.logger.log(`QR for ${userId} received`);
        this.qrCache.set(userId, qr); // Guardar QR en cache
        this.events.emitToUser(userId, "qr", qr);
      }

      if (connection === "open") {
        this.logger.log(`Connected: ${userId}`);
        this.qrCache.delete(userId); // Borrar QR cache al conectar
        this.events.emitToUser(userId, "connected", { userId });
      }

      if (connection === "close") {
        const reason =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.message ||
          "closed";
        this.logger.warn(`Connection closed for ${userId}: ${reason}`);
        this.events.emitToUser(userId, "disconnected", { userId, reason });
      }
    });

    sock.ev.on("messages.upsert", (m) => {
      this.logger.log(`message upsert for ${userId}`);
      this.events.emitToUser(userId, "message", m);
    });

    this.clients.set(userId, sock);

    return { ok: true };
  }

  async generateQr(userId: string) {
    if (!this.clients.has(userId)) await this.initSession(userId);
    return { ok: true };
  }

  async sendMessage(userId: string, to: string, text: string) {
    const sock = this.clients.get(userId);
    if (!sock) throw new Error("No session for user");
    const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
    const res = await sock.sendMessage(jid, { text });
    return res;
  }

  async getStatus(userId: string) {
    return { connected: this.clients.has(userId) };
  }

  // Devuelve el QR almacenado para el usuario
  getQr(userId: string): string | null {
    return this.qrCache.get(userId) || null;
  }

  onModuleDestroy() {
    this.clients.forEach((c) => c.end(new Error("Manual shutdown")));
  }
}
