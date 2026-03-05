import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Cart, CartSchema } from "./schemas/cart.schema";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { CatalogModule } from "../catalog/catalog.module";
import { Product, ProductSchema } from "../catalog/schema/product.schema";
import {
  ProductPrice,
  ProductPriceSchema,
} from "../catalog/schema/product-price.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductPrice.name, schema: ProductPriceSchema },
    ]),
    CatalogModule,
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
