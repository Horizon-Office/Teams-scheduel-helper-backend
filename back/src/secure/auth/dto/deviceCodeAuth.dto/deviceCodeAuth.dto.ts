import { IsString, IsOptional, IsIn, Matches } from 'class-validator';

export class DeviceCodeAuthDto {
    @IsString({ message: 'device_code must be a string' })
    @Matches(/^[a-zA-Z0-9._-]+$/, { 
      message: 'device_code contains invalid characters' 
    })
    device_code: string;
    
    @IsOptional()
    @IsString({ message: 'grant_type must be a string' })
    @IsIn(['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'], {
      message: 'grant_type must be either "urn:ietf:params:oauth:grant-type:device_code" or "refresh_token"'
    })
    grant_type?: string = 'urn:ietf:params:oauth:grant-type:device_code';
  }