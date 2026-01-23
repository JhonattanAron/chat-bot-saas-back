import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class ValidateClientKeyDto {
  @IsNotEmpty()
  @IsString()
  clientKey: string;

  @IsNotEmpty()
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
