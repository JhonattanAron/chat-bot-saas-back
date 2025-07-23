import { Module } from "@nestjs/common";
import { ApiKeyValidateController } from "./api-key-validate.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ApiKey, ApiKeySchema } from "./schema/api-key";
import { ApiKeyValidateService } from "./api-key-validate.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
  ],
  controllers: [ApiKeyValidateController],
  providers: [ApiKeyValidateService],
  exports: [ApiKeyValidateService],
})
export class ApiKeyValidateModule {}
