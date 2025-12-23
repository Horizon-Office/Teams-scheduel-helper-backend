import { IsString, IsOptional, Matches } from 'class-validator';

export class AuthCodeDto {

  @IsString({ message: 'authCode must be a string' })
  @Matches(/^[a-zA-Z0-9._-]+$/, { 
    message: 'authCode contains invalid characters' 
  })
  authCode: string;

  @IsString({ message: 'scope must be a string' })
  scope: string;

  @IsString({ message: 'redirectUri must be a string' })
  redirectUri: string;
}
