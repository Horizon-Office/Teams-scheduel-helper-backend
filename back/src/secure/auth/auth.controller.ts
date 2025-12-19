import { 
  Body, 
  Controller, 
  Post, 
  HttpCode, 
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException
} from '@nestjs/common';
import { DeviceCodeAuthDto } from './dto/deviceCodeAuth.dto/deviceCodeAuth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('devicecode')
  @HttpCode(HttpStatus.OK)
  async checkAuth(@Body() authDto: DeviceCodeAuthDto) {
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
}