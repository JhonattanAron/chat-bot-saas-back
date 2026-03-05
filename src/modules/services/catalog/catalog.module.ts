import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CatalogController } from "./catalog.controller";
import {
  ProductPrice,
  ProductPriceSchema,
} from "./schema/product-price.schema";
import { Product, ProductSchema } from "./schema/product.schema";
import { CatalogService } from "./service/catalog.service";
import { SeedCatalogService } from "./service/seed-catalog.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductPrice.name, schema: ProductPriceSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, SeedCatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
