import {
  Controller,
  Get,
  Req,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ProxyAuthGuard } from "../auth/proxy-auth.guard";
import { GlobalLogsService } from "./log.service";

@UseGuards(ProxyAuthGuard)
@Controller("logs")
export class GlobalLogsController {
  constructor(private readonly globalLogsService: GlobalLogsService) {}
  @Get("me")
  async getUserLogs(
    @Req() req: any,
    @Query("limit") limitQuery?: string,
    @Query("page") pageQuery?: string,
  ) {
    // ✅ obtener userId desde el request que pasa el ProxyAuthGuard
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException("Usuario no autenticado");

    // parámetros opcionales de paginación
    const limit = limitQuery ? parseInt(limitQuery) : 50;
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const logs = await this.globalLogsService.getLogsByUserId(userId, {
      limit,
      page,
    });

    return { success: true, data: logs };
  }
}
