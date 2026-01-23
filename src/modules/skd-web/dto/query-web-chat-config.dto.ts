import { IsOptional, IsMongoId, IsEnum, IsString } from 'class-validator';
import { ClientKeyStatus } from '../schemas/web-chat-config.schema';

export class QueryWebChatConfigDto {
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @IsOptional()
  @IsMongoId()
  assistant_id?: string;

  @IsOptional()
  @IsEnum(ClientKeyStatus)
  status?: ClientKeyStatus;

  @IsOptional()
  @IsString()
  domain?: string;
}
