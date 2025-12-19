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

@ApiTags('Authentication') // Changed to English
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('devicecode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Device authentication',
    description: 'Verifies device code and returns OAuth2 access tokens'
  })
  @ApiBody({ 
    type: DeviceCodeAuthDto,
    description: 'Device authorization data',
    required: true
  })
  @ApiResponse({ 
    status: 200,
    description: 'Authentication successful',
    schema: {
      example: {
        success: true,
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIs...',
          refresh_token: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4K',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400,
    description: 'Invalid data or authentication error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Device code verification failed: Invalid device code',
        error: 'Authentication Error'
      }
    }
  })
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