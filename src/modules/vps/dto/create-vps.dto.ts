import { IsString, IsNumber, IsEnum } from "class-validator";
import { VpsStatus } from "../schemas/vps.schema";

export class CreateVpsDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsString()
  name: string;

  @IsString()
  region: string;

  @IsString()
  os: string;

  @IsNumber()
  cores: number;

  @IsString()
  ram: string;

  @IsNumber()
  storage: number;

  @IsNumber()
  price: number;
}
