import { 
  Body, 
  Controller, 
  Post, 
  HttpCode, 
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';
import { DeviceCodeAuthDto } from './dto/deviceCodeAuth.dto/deviceCodeAuth.dto';
import { AuthService } from './auth.service';

@ApiTags('Authentication') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('devicecode')
  @HttpCode(HttpStatus.OK)
  async delegateTokenAuth(@Body() authDto: DeviceCodeAuthDto) {
    try {
      const result = await this.authService.checkDeviceCode(
        authDto.device_code, 
        authDto.grant_type
      );
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Device code verification failed: ' + error.message,
        error: 'Authentication Error'
      });
    }
  }

  @Post('validateToken')
  async validateToken(@Body('access_token') access_token: string) {
    try {
      const tokenData = await this.authService.validateAccessToken(access_token);
      return {
        validate: true
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Token validation failed: ' + error.message,
        error: 'Validation Error'
      });
    }
  }
}