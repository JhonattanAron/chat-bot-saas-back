import { Module, forwardRef } from "@nestjs/common";
import { ContaboService } from "./contabo.service";
import { VpsModule } from "../vps/vps.module";

@Module({
  imports: [forwardRef(() => VpsModule)],
  controllers: [],
  providers: [ContaboService],
  exports: [ContaboService],
})
export class ContaboModule {}
