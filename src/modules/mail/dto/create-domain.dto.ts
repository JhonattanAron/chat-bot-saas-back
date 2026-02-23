import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
