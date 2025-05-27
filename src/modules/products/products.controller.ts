// src/products/products.controller.ts
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get("search")
  async search(@Query("q") query: string, @Query("user_id") userId: string) {
    return this.service.search(query, userId);
  }
  @Post("bulk")
  createMany(@Body() products: CreateProductDto[]) {
    return this.service.createMany(products);
  }
}
