"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = __importStar(require("@adiwajshing/baileys"));
const sessions_service_1 = require("./sessions.service");
const events_gateway_1 = require("./events.gateway");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(sessions, events) {
        this.sessions = sessions;
        this.events = events;
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.clients = new Map();
        this.qrCache = new Map();
    }
    async initSession(userId) {
        const saved = this.sessions.loadSession(userId);
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        this.logger.log(`Baileys version ${version.join(".")} (latest: ${isLatest})`);
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(`./whatsapp_auth_${userId}`);
        const sock = (0, baileys_1.default)({ version, auth: state });
        sock.ev.on("creds.update", saveCreds);
        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                this.logger.log(`QR for ${userId} received`);
                this.qrCache.set(userId, qr);
                this.events.emitToUser(userId, "qr", qr);
            }
            if (connection === "open") {
                this.logger.log(`Connected: ${userId}`);
                this.qrCache.delete(userId);
                this.events.emitToUser(userId, "connected", { userId });
            }
            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode ||
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
    async generateQr(userId) {
        if (!this.clients.has(userId))
            await this.initSession(userId);
        return { ok: true };
    }
    async sendMessage(userId, to, text) {
        const sock = this.clients.get(userId);
        if (!sock)
            throw new Error("No session for user");
        const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
        const res = await sock.sendMessage(jid, { text });
        return res;
    }
    async getStatus(userId) {
        return { connected: this.clients.has(userId) };
    }
    getQr(userId) {
        return this.qrCache.get(userId) || null;
    }
    onModuleDestroy() {
        this.clients.forEach((c) => c.end(new Error("Manual shutdown")));
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService,
        events_gateway_1.EventsGateway])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map