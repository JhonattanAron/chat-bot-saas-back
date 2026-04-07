import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ResourcesService } from "./resources.service";
import { ResourcesController } from "./resources.controller";
import {
  ContractAsset,
  ContractAssetSchema,
} from "../contracted-assets/contract-assets.schema";
import { UsageModule } from "../service-usage/usage.module";
import { ProductsModule } from "../products/products.module";
import { CatalogModule } from "../services/catalog/catalog.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContractAsset.name, schema: ContractAssetSchema },
    ]),
    UsageModule,
    CatalogModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
