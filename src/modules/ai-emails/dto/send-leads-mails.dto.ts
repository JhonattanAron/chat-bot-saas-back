// mail/dto/send-leads-mails.dto.ts
import { IsArray, IsString } from "class-validator";

export class LeadDto {
  @IsString()
  userId: string;

  @IsString()
  empresa: string;

  @IsString()
  descripcion: string;

  @IsArray()
  emails: string[];

  @IsString()
  razon: string;

  @IsString()
  nivel_interes: string;

  @IsString()
  batch: string;
}

export class SendLeadsMailsDto {
  @IsArray()
  leads: LeadDto[];
}
