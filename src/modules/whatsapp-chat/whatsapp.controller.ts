import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { WhatsappService } from "./whatsapp.service";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post("connect/:userId")
  async connect(@Param("userId") userId: string) {
    try {
      return await this.whatsappService.initSession(userId);
    } catch (error) {
      throw new HttpException(
        { message: "Error iniciando sesión WhatsApp", detail: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("qr/:userId")
  async getQr(@Param("userId") userId: string) {
    try {
      const qr = this.whatsappService.getQr(userId);
      const status = await this.whatsappService.getStatus(userId);
      return {
        qr,
        ready: status.connected,
      };
    } catch (error) {
      throw new HttpException(
        { message: "Error obteniendo QR", detail: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("send/:userId")
  async sendMessage(
    @Param("userId") userId: string,
    @Body() body: { to: string; text: string }
  ) {
    try {
      const { to, text } = body;
      if (!to || !text) {
        throw new HttpException(
          "Parámetros 'to' y 'text' son obligatorios",
          HttpStatus.BAD_REQUEST
        );
      }
      return await this.whatsappService.sendMessage(userId, to, text);
    } catch (error) {
      throw new HttpException(
        { message: "Error enviando mensaje", detail: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("status/:userId")
  async getStatus(@Param("userId") userId: string) {
    try {
      return await this.whatsappService.getStatus(userId);
    } catch (error) {
      throw new HttpException(
        { message: "Error obteniendo estado", detail: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
