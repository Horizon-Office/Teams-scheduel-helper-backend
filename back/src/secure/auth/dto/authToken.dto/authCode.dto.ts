import { IsString, IsOptional, Matches } from 'class-validator';

export class AuthCodeDto {

  @IsString({ message: 'authCode must be a string' })
  authCode: string;

  @IsString({ message: 'scope must be a string' })
  scope: string;

  @IsString({ message: 'redirectUri must be a string' })
  redirectUri: string;
}
