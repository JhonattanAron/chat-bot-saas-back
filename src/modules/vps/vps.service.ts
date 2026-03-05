import { Get, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Vps, VpsDocument, VpsStatus } from "./schemas/vps.schema";
import { CreateVpsDto } from "./dto/create-vps.dto";
import * as crypto from "crypto";
import { ContaboService } from "../contabo/contabo.service";

@Injectable()
export class VpsService {
  constructor(
    @InjectModel(Vps.name)
    private vpsModel: Model<VpsDocument>,
    private readonly contaboService: ContaboService,
  ) {}

  // Simula creación real del VPS
  async create(createVpsDto: CreateVpsDto) {
    const { userId, planId, region } = createVpsDto;

    // 1️⃣ Crear instancia real en Contabo
    const instance = await this.contaboService.createInstance(
      planId,
      region || "EU",
    );

    // 2️⃣ Guardar en tu base de datos
    const vps = await this.vpsModel.create({
      userId,
      name: instance.displayName,
      ip: instance.ipConfig?.v4?.ip,
      sshUser: "root",
      sshPassword: instance.initialPassword,
      status: VpsStatus.RUNNING,
      region: instance.region,
      cores: instance.cpuCores,
      ram: `${instance.memory}GB`,
      storage: instance.diskSize,
      price: createVpsDto.price,
      externalId: instance.instanceId,
      cpu: 0,
      memory: 0,
      uptime: "0 días",
      lastUpdate: new Date(),
    });

    return vps;
  }
  async findAllByUser(userId: string) {
    return this.vpsModel.find({ userId });
  }

  async findOne(id: string) {
    const vps = await this.vpsModel.findById(id);
    if (!vps) throw new NotFoundException("VPS no encontrado");
    return vps;
  }

  async updateStatus(id: string, status: VpsStatus) {
    const vps = await this.findOne(id);
    vps.status = status;
    vps.lastUpdate = new Date();
    return vps.save();
  }

  async remove(id: string) {
    return this.vpsModel.findByIdAndDelete(id);
  }
}
