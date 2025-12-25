import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @IsString()
  @IsNotEmpty()
  scope: string;
}