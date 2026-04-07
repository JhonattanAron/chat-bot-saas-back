import { Module } from "@nestjs/common";
import { OpenRouterService } from "./openrouter.service";
import { OpenRouterController } from "./openrouter.controller";
import { ResourcesModule } from "src/modules/service-resources/resources.module";
import { ApiKeyValidateModule } from "src/modules/api-key-validate/api-key-validate.module";
import { GlobalLogsController } from "../logs.controller";
import { GlobalLogsService } from "../log.service";
import { MongooseModule } from "@nestjs/mongoose";
import { GlobalLog, GlobalLogSchema } from "../logs.schema";

@Module({
  imports: [
    ResourcesModule,
    ApiKeyValidateModule,
    MongooseModule.forFeature([
      { name: GlobalLog.name, schema: GlobalLogSchema },
    ]),
  ],
  providers: [OpenRouterService, GlobalLogsService],
  controllers: [OpenRouterController, GlobalLogsController],
  exports: [OpenRouterService],
})
export class OpenRouterModule {}
