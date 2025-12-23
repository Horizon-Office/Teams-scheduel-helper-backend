import { 
  Body, 
  Controller, 
  Post, 
  HttpCode, 
  HttpStatus,
  BadRequestException,
  Redirect
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';
import { AuthCodeDto} from './dto/authToken.dto/authCode.dto';
import { AuthService } from './auth.service';
import { ValidateTokenDto } from './dto/validateToken.dto/validateToken.dto';

@ApiTags('Authentication') 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('delegateToken')
  @HttpCode(HttpStatus.OK)
  async delegateTokenAuth(@Body() authDto: AuthCodeDto) {
    try {
      const result = await this.authService.getIdentifiedDelegateToken(
        authDto.authCode,
        authDto.scope,
        authDto.redirectUri
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
  async validateToken(@Body() validateDto: ValidateTokenDto) {
    try {
      await this.authService.validateAccessToken(validateDto.access_token);
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