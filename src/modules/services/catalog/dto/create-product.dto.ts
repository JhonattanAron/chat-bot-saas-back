import { IsString, IsEnum, IsOptional, IsObject } from "class-validator";
import { ProductCategory } from "../schema/product.schema";

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
