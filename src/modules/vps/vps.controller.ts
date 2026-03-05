import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { VpsService } from "./vps.service";
import { CreateVpsDto } from "./dto/create-vps.dto";
import { VpsStatus } from "./schemas/vps.schema";
import { ContaboService } from "../contabo/contabo.service";

@Controller("vps")
export class VpsController {
  constructor(
    private readonly vpsService: VpsService,
    private readonly contaboService: ContaboService,
  ) {}

  @Post()
  create(@Body() createVpsDto: CreateVpsDto) {
    return this.vpsService.create(createVpsDto);
  }

  @Get("user/:userId")
  findAll(@Param("userId") userId: string) {
    return this.vpsService.findAllByUser(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.vpsService.findOne(id);
  }

  @Patch(":id/status/:status")
  updateStatus(@Param("id") id: string, @Param("status") status: VpsStatus) {
    return this.vpsService.updateStatus(id, status);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vpsService.remove(id);
  }
  @Get("get/plans")
  async getPlans() {
    const products = await this.contaboService.getProducts();
    const markup = 1.5;
    return products.map((p: any) => ({
      id: p.productId,
      name: `VPS ${p.cpuCores}vCPU ${p.memory}GB`,
      cores: p.cpuCores,
      ram: `${p.memory}GB`,
      storage: `${p.diskSize}GB`,
      price: p.price * markup,
      currency: p.currency,
    }));
  }
}
