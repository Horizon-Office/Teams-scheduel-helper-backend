import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty({ example: 'user.read openid profile' })
  @IsString()
  @IsNotEmpty()
  scope: string;
}
