import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Vps, VpsSchema } from "./schemas/vps.schema";
import { VpsService } from "./vps.service";
import { VpsController } from "./vps.controller";
import { ContaboModule } from "../contabo/contabo.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vps.name, schema: VpsSchema }]),
    forwardRef(() => ContaboModule),
  ],
  controllers: [VpsController],
  providers: [VpsService],
  exports: [VpsService],
})
export class VpsModule {}
