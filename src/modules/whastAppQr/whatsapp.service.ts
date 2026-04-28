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

        onUpdate({ connected: true });
        return;
      }

      // 🔌 DESCONECTADO
      if (connection === "close") {
        state.isConnecting = false;

        const error = lastDisconnect?.error as Boom;
        const code = error?.output?.statusCode;

        // 🚪 LOGOUT (PRIMERO)
        if (code === DisconnectReason.loggedOut) {
          this.logger.warn(`🚪 Logout ${userId}`);

          if (existsSync(sessionPath)) {
            rmSync(sessionPath, { recursive: true, force: true });
          }

          this.sessions.delete(userId);
          onUpdate({ connected: false });
          return;
        }

        // 🚫 nunca se autenticó → no reconectar
        if (!state.connected) {
          this.logger.warn(`⛔ No autenticado → no reconectar ${userId}`);
          return;
        }

        // 🌐 fallo de conexión
        if (error?.message?.includes("Connection Failure")) {
          this.logger.warn(`🌐 Connection Failure ${userId}`);
        }

        // 🔁 reconexión controlada
        state.connected = false;
        state.reconnectAttempts++;

        const delay = Math.min(
          30000,
          5000 * Math.pow(2, state.reconnectAttempts),
        );

        this.logger.warn(
          `🔄 Reintentando ${userId} en ${delay / 1000}s (intento ${state.reconnectAttempts})`,
        );

        setTimeout(() => {
          if (!this.sessions.has(userId)) return;
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
     SOCKET
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
      message: "Envío completado",
    };
  }

  /* ======================
     CERRAR SESIÓN
  ====================== */
  async closeSession(userId: string) {
    const state = this.sessions.get(userId);
    if (!state) return;

    try {
      // 🔥 primero limpiar listeners
      state.socket?.ev.removeAllListeners("connection.update");
      state.socket?.ev.removeAllListeners("creds.update");

      // 🔌 luego cerrar
      state.socket?.end?.(new Error("Manual close"));
    } catch (err) {
      this.logger.warn(`⚠️ Error cerrando socket: ${err}`);
    }

    const sessionPath = `./sessions/${userId}`;

    if (existsSync(sessionPath)) {
      rmSync(sessionPath, { recursive: true, force: true });
    }

    this.sessions.delete(userId);

    this.logger.log(`🧹 Sesión cerrada correctamente ${userId}`);
  }

  /* ======================
     DELAY HUMANO
  ====================== */
  private async randomDelay() {
    const delay = 4000 + Math.random() * 6000;
    return new Promise((res) => setTimeout(res, delay));
  }
}
