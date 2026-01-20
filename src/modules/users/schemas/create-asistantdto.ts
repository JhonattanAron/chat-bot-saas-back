import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

class FunctionParameterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

class FunctionHeaderDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class FunctionAuthDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class FunctionApiDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionHeaderDto)
  headers?: FunctionHeaderDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionParameterDto)
  parameters?: FunctionParameterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionAuthDto)
  auth?: FunctionAuthDto;
}

class FunctionCredentialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class FunctionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(["api", "custom"])
  type: "api" | "custom";

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionApiDto)
  api?: FunctionApiDto;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionCredentialDto)
  credentials?: FunctionCredentialDto[];
}

export class CreateAssistantDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionDto)
  funciones: FunctionDto[];

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  use_case: string;

  @IsString()
  @IsNotEmpty()
  welcome_message: string;
}
