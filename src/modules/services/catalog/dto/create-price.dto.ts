import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsMongoId,
} from "class-validator";
import { BillingType, BillingInterval } from "../schema/product-price.schema";

export class CreatePriceDto {
  @IsMongoId()
  productId: string;

  @IsEnum(BillingType)
  billingType: BillingType;

  @IsOptional()
  @IsEnum(BillingInterval)
  interval?: BillingInterval;

  @IsNumber()
  price: number;

  @IsOptional()
  currency?: string;

  @IsOptional()
  stripePriceId?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
