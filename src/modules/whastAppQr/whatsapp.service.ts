import { Injectable, Logger } from "@nestjs/common";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { existsSync, rmSync } from "fs";

type SessionState = {
  socket?: WASocket;
  reconnectAttempts: number;
  isConnecting: boolean;
  qr?: string | null;
  connected: boolean;
};

@Injectable()
export class WhatsappService {
  private logger = new Logger(WhatsappService.name);
  private sessions = new Map<string, SessionState>();

  /* ======================
     INICIAR SESIÓN
  ====================== */
  async startSession(
    userId: string,
    onUpdate: (data: { qr?: string | null; connected?: boolean }) => void,
  ) {
    let state = this.sessions.get(userId);

    if (!state) {
      state = {
        reconnectAttempts: 0,
        isConnecting: false,
        connected: false,
        qr: null,
      };
      this.sessions.set(userId, state);
    }

    // 🔒 evitar múltiples conexiones
    if (state.isConnecting) {
      this.logger.warn(`⛔ Ya conectando ${userId}`);
      return;
    }

    state.isConnecting = true;

    const sessionPath = `./sessions/${userId}`;
    const { state: authState, saveCreds } =
      await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: authState,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 20000,
      keepAliveIntervalMs: 15000,
    });

    state.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;

      // 📷 QR
      if (qr) {
        state.qr = qr;
        state.connected = false;
        onUpdate({ qr, connected: false });
        return;
      }

      // ✅ CONECTADO
      if (connection === "open") {
        this.logger.log(`✅ Conectado ${userId}`);

        state.qr = null;
        state.connected = true;
        state.reconnectAttempts = 0;
        state.isConnecting = false;

        onUpdate({ qr: null, connected: true });
        return;
      }

      // 🔌 DESCONECTADO
      if (connection === "close") {
        state.connected = false;
        state.isConnecting = false;

        const error = lastDisconnect?.error as Boom;
        const code = error?.output?.statusCode;

        // 🚪 LOGOUT
        if (code === DisconnectReason.loggedOut) {
          this.logger.warn(`🚪 Logout ${userId}`);

          if (existsSync(sessionPath)) {
            rmSync(sessionPath, { recursive: true, force: true });
          }

          this.sessions.delete(userId);
          onUpdate({ connected: false });
          return;
        }

        // 🌐 fallo de conexión
        if (error?.message?.includes("Connection Failure")) {
          this.logger.warn(`🌐 Connection Failure ${userId}`);
        }

        // 📈 BACKOFF EXPONENCIAL
        state.reconnectAttempts++;

        const delay = Math.min(
          30000,
          5000 * Math.pow(2, state.reconnectAttempts),
        );

        this.logger.warn(
          `🔄 Reintentando ${userId} en ${delay / 1000}s (intento ${state.reconnectAttempts})`,
        );

        setTimeout(() => {
          this.startSession(userId, onUpdate);
        }, delay);
      }
    });
  }

  /* ======================
     ESTADO
  ====================== */
  getSessionState(userId: string) {
    const state = this.sessions.get(userId);

    if (!state) {
      return {
        qr: null,
        connected: false,
        reconnecting: false,
        attempts: 0,
      };
    }

    return {
      qr: state.qr ?? null,
      connected: state.connected,
      reconnecting: state.isConnecting,
      attempts: state.reconnectAttempts,
    };
  }

  isConnected(userId: string): boolean {
    return this.sessions.get(userId)?.connected ?? false;
  }

  /* ======================
     OBTENER SOCKET
  ====================== */
  private getSocket(userId: string): WASocket {
    const sock = this.sessions.get(userId)?.socket;
    if (!sock) throw new Error("Sesión no iniciada");
    return sock;
  }

  /* ======================
     ENVIAR MENSAJE
  ====================== */
  async sendMessage(userId: string, phone: string, message: string) {
    const sock = this.getSocket(userId);

    await sock.sendMessage(`${phone}@s.whatsapp.net`, {
      text: message,
    });

    await this.randomDelay();
  }

  /* ======================
     ENVÍO MASIVO
  ====================== */
  async sendBulk(userId: string, phones: string[], message: string) {
    for (const phone of phones) {
      try {
        await this.sendMessage(userId, phone, message);
        this.logger.log(`✅ Enviado a ${phone}`);
      } catch (err: any) {
        this.logger.warn(`⚠️ Error con ${phone}: ${err?.message}`);
      }
    }

    return {
      status: "ok",
      message: `Envío completado`,
    };
  }

  /* ======================
     CERRAR SESIÓN
  ====================== */
  async closeSession(userId: string) {
    const state = this.sessions.get(userId);
    if (!state) return;

    try {
      state.socket?.end;
    } catch {}

    const sessionPath = `./sessions/${userId}`;

    if (existsSync(sessionPath)) {
      rmSync(sessionPath, { recursive: true, force: true });
    }

    this.sessions.delete(userId);

    this.logger.log(`🧹 Sesión cerrada ${userId}`);
  }

  /* ======================
     DELAY HUMANO (ANTI-BAN)
  ====================== */
  private async randomDelay() {
    const delay = 4000 + Math.random() * 6000;
    return new Promise((res) => setTimeout(res, delay));
  }
}
