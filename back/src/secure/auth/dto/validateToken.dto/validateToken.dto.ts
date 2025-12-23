import { IsString, IsOptional, Matches } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  access_token: string;
}
