import { IsOptional, IsString, IsMongoId, IsEnum } from 'class-validator';
import { ClientKeyStatus } from '../schemas/web-chat-config.schema';

export class UpdateWebChatConfigDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsMongoId()
  apiKeyId?: string;

  @IsOptional()
  @IsEnum(ClientKeyStatus)
  status?: ClientKeyStatus;
}

export class UpdateStatusDto {
  @IsMongoId()
  userId: string;
}
