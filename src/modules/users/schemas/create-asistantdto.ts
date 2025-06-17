import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class FunctionParameterDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNotEmpty()
  required: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

class FunctionApiDto {
  @IsString()
  url: string;

  @IsString()
  method: string;

  @IsOptional()
  headers?: { key: string; value: string }[];

  @IsOptional()
  parameters?: FunctionParameterDto[];

  @IsOptional()
  auth?: { type: string; value: string };
}

class FunctionDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionApiDto)
  api?: FunctionApiDto;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  credentials?: { name: string; value: string; description?: string }[];
}

export class CreateAssistantDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionDto)
  funciones: FunctionDto[];

  @IsString()
  status: string;

  @IsString()
  type: string;

  @IsString()
  use_case: string;

  @IsString()
  welcome_message: string;
}
