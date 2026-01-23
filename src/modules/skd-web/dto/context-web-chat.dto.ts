import { IsOptional, IsUrl, IsString, IsNumber } from "class-validator";

export class ClientContextDto {
  @IsOptional()
  @IsUrl()
  origin?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @IsOptional()
  @IsString()
  pathname?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}
