import { IsString, IsEnum, IsOptional, IsNumber } from "class-validator";

export class AddToCartDto {
  @IsString()
  itemId: string;

  @IsEnum(["plan", "addon"])
  type: "plan" | "addon";

  @IsOptional()
  @IsEnum(["month", "year"])
  billingInterval?: "month" | "year";

  @IsOptional()
  @IsNumber()
  quantity?: number;
}
