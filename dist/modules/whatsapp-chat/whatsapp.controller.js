"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsappController = class WhatsappController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    async connect(userId) {
        try {
            return await this.whatsappService.initSession(userId);
        }
        catch (error) {
            throw new common_1.HttpException({ message: "Error iniciando sesión WhatsApp", detail: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getQr(userId) {
        try {
            const qr = this.whatsappService.getQr(userId);
            const status = await this.whatsappService.getStatus(userId);
            return {
                qr,
                ready: status.connected,
            };
        }
        catch (error) {
            throw new common_1.HttpException({ message: "Error obteniendo QR", detail: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendMessage(userId, body) {
        try {
            const { to, text } = body;
            if (!to || !text) {
                throw new common_1.HttpException("Parámetros 'to' y 'text' son obligatorios", common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.whatsappService.sendMessage(userId, to, text);
        }
        catch (error) {
            throw new common_1.HttpException({ message: "Error enviando mensaje", detail: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStatus(userId) {
        try {
            return await this.whatsappService.getStatus(userId);
        }
        catch (error) {
            throw new common_1.HttpException({ message: "Error obteniendo estado", detail: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)("connect/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)("qr/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "getQr", null);
__decorate([
    (0, common_1.Post)("send/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)("status/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "getStatus", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, common_1.Controller)("whatsapp"),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map