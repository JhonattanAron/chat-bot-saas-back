import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ContactImportItem {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class ImportContactsDto {
  ownerId: string;

  @IsString()
  source: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactImportItem)
  contacts: ContactImportItem[];
}
