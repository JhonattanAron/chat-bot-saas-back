import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ContractedAssetsService } from "./contracted-assets.service";
import { ContractAsset, ContractAssetSchema } from "./contract-assets.schema";
import { ContractedAssetsController } from "./contracted-assets.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: ContractAsset.name, schema: ContractAssetSchema }])],
  controllers: [ContractedAssetsController],
  providers: [ContractedAssetsService],
  exports: [ContractedAssetsService],
})
export class ContractedAssetsModule {}
