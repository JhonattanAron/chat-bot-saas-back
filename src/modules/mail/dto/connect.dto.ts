import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ConnectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  apiKey: string;
}
