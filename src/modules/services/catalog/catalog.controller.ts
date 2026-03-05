import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreatePriceDto } from "./dto/create-price.dto";
import { UpdatePriceDto } from "./dto/update-price.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { CatalogService } from "./service/catalog.service";
import { SeedCatalogDto } from "./dto/seed-catalog.dto";
import { SeedCatalogService } from "./service/seed-catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly seedcatalogService: SeedCatalogService,
  ) {}

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Patch("products/:id")
  updateProduct(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Get("products")
  findProducts(@Query() query: QueryProductDto) {
    return this.catalogService.findProducts(query);
  }

  @Post("prices")
  createPrice(@Body() dto: CreatePriceDto) {
    return this.catalogService.createPrice(dto);
  }

  @Patch("prices/:id")
  updatePrice(@Param("id") id: string, @Body() dto: UpdatePriceDto) {
    return this.catalogService.updatePrice(id, dto);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getProductWithPrices(slug);
  }

  @Post("seed")
  seedCatalog(@Body() dto: SeedCatalogDto) {
    return this.seedcatalogService.seedCatalog(dto);
  }

  @Get("products/:id/prices")
  getPricesByProductId(@Param("id") id: string) {
    return this.catalogService.getPricesByProductId(id);
  }
}
