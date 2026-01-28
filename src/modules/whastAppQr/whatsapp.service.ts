import { Injectable, Logger } from "@nestjs/common";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { delay } from "./utils/delay.util";

@Injectable()
export class WhatsappService {
  private logger = new Logger(WhatsappService.name);
  private sessions = new Map<string, WASocket>();

  /* ======================
     INICIAR SESIÓN / CONECTAR
  ====================== */
  async startSession(userId: string, onQR: (qr: string) => void) {
    // eliminar sesión antigua si existe
    if (this.sessions.has(userId)) {
      this.logger.log(`🗑️ Sesión antigua eliminada para ${userId}`);
      this.sessions.delete(userId);
    }

    // inicializar estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(
      `./sessions/${userId}`,
    );

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    // guardar credenciales automáticamente
    sock.ev.on("creds.update", saveCreds);

    // guardar socket en memoria
    this.sessions.set(userId, sock);

    // manejar eventos de conexión
    sock.ev.on("connection.update", (update) => {
      // QR generado
      if (update.qr) {
        this.logger.log(`📷 QR generado para ${userId}`);
        onQR(update.qr);
      }

      // sesión conectada
      if (update.connection === "open") {
        this.logger.log(`✅ WhatsApp conectado: ${userId}`);
      }

      // sesión cerrada
      if (update.connection === "close") {
        const lastDisconnect = update.lastDisconnect;
        let statusCode: number | undefined;

        // verificar si es un Boom (Baileys error)
        if (lastDisconnect?.error && "output" in lastDisconnect.error) {
          statusCode = (lastDisconnect.error as any).output?.statusCode;
        }

        // eliminar socket de memoria
        this.sessions.delete(userId);

        if (statusCode === DisconnectReason.loggedOut) {
          this.logger.warn(`⚠️ Sesión de ${userId} cerrada por logout`);
        } else if (statusCode === 409) {
          this.logger.warn(
            `⚠️ Sesión de ${userId} cerrada por conflicto (abierta en otro dispositivo), no reiniciando`,
          );
        } else {
          this.logger.warn(
            `🔄 Sesión cerrada para ${userId}, reiniciando en 3s...`,
          );
          setTimeout(() => this.startSession(userId, onQR), 3000);
        }
      }
    });
  }

  /* ======================
     OBTENER SESIÓN
  ====================== */
  getSession(userId: string) {
    return this.sessions.get(userId);
  }

  /* ======================
     ENVIAR UN MENSAJE
  ====================== */
  async sendMessage(userId: string, phone: string, message: string) {
    const sock = this.getSession(userId);
    if (!sock) throw new Error("Sesión no iniciada");

    await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
  }

  /* ======================
     ENVIAR MENSAJES MASIVOS
  ====================== */
  async sendBulk(userId: string, phones: string[], message: string) {
    const sock = this.getSession(userId);
    if (!sock) throw new Error("Sesión no iniciada");

    for (const phone of phones) {
      await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
      await delay(3000, 6000); // anti-ban
    }
  }

  /* ======================
     VERIFICAR SI HAY SESIÓN ACTIVA
  ====================== */
  isConnected(userId: string): boolean {
    return this.sessions.has(userId);
  }
}
