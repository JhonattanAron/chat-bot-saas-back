import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats/:userId")
  async getDashboardStats(@Param("userId") userId: string) {
    try {
      return await this.dashboardService.getDashboardStats(userId);
    } catch (error) {
      throw new HttpException(
        "Error al obtener estadísticas del dashboard",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("bots/:userId")
  async getUserBots(@Param("userId") userId: string) {
    try {
      return await this.dashboardService.getUserBots(userId);
    } catch (error) {
      throw new HttpException(
        "Error al obtener bots del usuario",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("token-usage/:userId")
  async getTokenUsage(@Param("userId") userId: string) {
    try {
      return await this.dashboardService.getTokenUsage(userId);
    } catch (error) {
      throw new HttpException(
        "Error al obtener uso de tokens",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("analytics/:userId")
  async getAnalytics(@Param("userId") userId: string) {
    try {
      return await this.dashboardService.getAnalytics(userId);
    } catch (error) {
      throw new HttpException(
        "Error al obtener análisis",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
