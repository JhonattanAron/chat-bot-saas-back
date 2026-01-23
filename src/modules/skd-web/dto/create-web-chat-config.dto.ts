import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateWebChatConfigDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  assistantId: string;

  @IsOptional()
  @IsMongoId()
  apiKeyId?: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
