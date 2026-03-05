// src/products/products.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import {
  ProductAssistan,
  ProductSchema,
} from "./schemas/product-assistant.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductAssistan.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
