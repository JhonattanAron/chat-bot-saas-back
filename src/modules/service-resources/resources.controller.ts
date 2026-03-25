import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ResourcesService } from "./resources.service";
import { ProxyAuthGuard } from "../auth/proxy-auth.guard";

@UseGuards(ProxyAuthGuard)
@Controller("me")
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get("resources")
  async getMyResources(@Req() req: any) {
    const userId = req.user.id; // 👈 depende de tu auth
    return this.resourcesService.getUserResources(userId);
  }
}
