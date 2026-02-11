import { Injectable, Logger } from "@nestjs/common";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { existsSync, rmSync } from "fs";
import { delay } from "./utils/delay.util";

@Injectable()
export class WhatsappService {
  private logger = new Logger(WhatsappService.name);
  private sessions = new Map<string, WASocket>();

  /* ======================
     INICIAR SESIÓN
  ====================== */
  async startSession(
    userId: string,
    onUpdate: (data: { qr?: string | null; connected?: boolean }) => void,
  ) {
    const sessionPath = `./sessions/${userId}`;

    // evitar sockets duplicados
    if (this.sessions.has(userId)) {
      this.logger.warn(`⚠️ Sesión ya activa para ${userId}`);
      return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    sock.ev.on("creds.update", saveCreds);
    this.sessions.set(userId, sock);

    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;

      /* 📷 QR */
      if (qr) {
        this.logger.log(`📷 QR generado para ${userId}`);
        onUpdate({ qr, connected: false });
        return;
      }

      /* ✅ CONECTADO */
      if (connection === "open") {
        this.logger.log(`✅ WhatsApp conectado: ${userId}`);
        onUpdate({ qr: null, connected: true });
        return;
      }

      /* 🔌 DESCONECTADO */
      if (connection === "close") {
        const error = lastDisconnect?.error;
        const statusCode = this.getStatusCode(error);

        this.sessions.delete(userId);

        /* 🚪 LOGOUT REAL */
        if (this.isLoggedOut(error)) {
          this.logger.warn(`🚪 Logout detectado para ${userId}`);

          if (existsSync(sessionPath)) {
            rmSync(sessionPath, { recursive: true, force: true });
            this.logger.log(`🧹 Carpeta eliminada: ${sessionPath}`);
          }

          onUpdate({ connected: false });
          return;
        }

        /* ⚠️ CONFLICTO 409 */
        if (statusCode === 409) {
          this.logger.warn(`⚠️ Conflicto de sesión para ${userId}`);
          onUpdate({ connected: false });
          return;
        }

        /* 🔄 ERROR TEMPORAL → REINTENTAR */
        this.logger.warn(`🔄 Error temporal, reintentando ${userId}`);
        setTimeout(() => {
          this.startSession(userId, onUpdate);
        }, 3000);
      }
    });
  }

  /* ======================
     HELPERS (TYPE SAFE)
  ====================== */
  private getStatusCode(error: unknown): number | undefined {
    if (error instanceof Boom) {
      return error.output?.statusCode;
    }
    return undefined;
  }

  private isLoggedOut(error: unknown): boolean {
    if (error instanceof Boom) {
      return (
        error.output?.statusCode === DisconnectReason.loggedOut ||
        error.data === DisconnectReason.loggedOut
      );
    }

    if (error instanceof Error) {
      return error.message.toLowerCase().includes("logged out");
    }

    return false;
  }

  /* ======================
     OBTENER SESIÓN
  ====================== */
  getSession(userId: string) {
    return this.sessions.get(userId);
  }

  /* ======================
     ENVIAR MENSAJE
  ====================== */
  async sendMessage(userId: string, phone: string, message: string) {
    const sock = this.getSession(userId);
    if (!sock) throw new Error("Sesión no iniciada");
    console.log("Mensaje Enviado....");

    await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
  }

  /* ======================
     ENVÍO MASIVO
  ====================== */
  async sendBulk(userId: string, phones: string[], message: string) {
    const sock = this.getSession(userId);
    if (!sock) throw new Error("Sesión no iniciada");

    (async () => {
      for (const phone of phones) {
        try {
          await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
          this.logger.log(`✅ Enviado a ${phone}`);
        } catch (err: any) {
          this.logger.warn(`⚠️ Error enviando a ${phone}: ${err?.message}`);
        }
        await delay(3000, 6000);
      }
      this.logger.log("📩 Envío masivo finalizado");
    })();

    return {
      status: "ok",
      message: `Envío iniciado para ${phones.length} números`,
    };
  }

  /* ======================
     ESTADO
  ====================== */
  isConnected(userId: string): boolean {
    return this.sessions.has(userId);
  }
}
