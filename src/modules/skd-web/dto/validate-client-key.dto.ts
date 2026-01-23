import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsNotEmpty,
  ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";
import { ClientContextDto } from "./context-web-chat.dto";

export class ValidateClientKeyDto {
  @IsString()
  @IsNotEmpty()
  clientKey: string;

  @IsOptional()
  @IsString()
  widgetSessionId?: string;

  @ValidateNested()
  @Type(() => ClientContextDto)
  context: ClientContextDto;
}
