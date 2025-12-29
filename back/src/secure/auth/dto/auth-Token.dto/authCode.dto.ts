import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthCodeDto {

  @ApiProperty({ example: 'abc123xyz' })
  @IsString({ message: 'authCode must be a string' })
  authCode: string;

  @ApiProperty({ example: 'user.read openid profile' })
  @IsString({ message: 'scope must be a string' })
  scope: string;

  @ApiProperty({ example: 'https://myapp.com/callback' })
  @IsString({ message: 'redirectUri must be a string' })
  redirectUri: string;
}
