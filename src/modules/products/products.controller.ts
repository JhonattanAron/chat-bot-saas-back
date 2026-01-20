// src/products/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
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
  @Post()
  async create(
    @Body()
    body: {
      name: string;
      price: string;
      description: string;
      user_id: string;
      tags?: string[];
      available?: boolean;
      stock?: number;
      assistant_id: string;
    }
  ) {
    const product = {
      ...body,
      name:
        `{${body.name}}{${body.price}}{${body.description}}` +
        "{stock: " +
        (body.stock !== undefined ? `${body.stock}}` : ""),
      tags: body.tags ?? [],
      available: body.available ?? true,
    };
    return this.service.create(product, body.user_id, body.assistant_id);
  }

  @Get()
  async findAll(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string
  ) {
    return this.service.findAll(user_id, assistant_id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Query("user_id") user_id: string,
    @Body()
    body: {
      name: string;
      price: string;
      description: string;
      tags?: string[];
      stock?: number;
    }
  ) {
    const update = {
      ...body,
      name:
        `{${body.name}}{${body.price}}{${body.description}}` +
        (body.stock !== undefined ? `${body.stock}` : ""),
    };
    return this.service.update(id, user_id, update);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
