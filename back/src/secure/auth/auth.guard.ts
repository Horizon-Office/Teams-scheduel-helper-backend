import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    try {

      const token = this.authService.extractTokenFromHeader(authHeader);
      const tokenData = await this.authService.validateAccessToken(token);
      request.user = tokenData;
      return true; 
      
    } catch (error) {

      if (error instanceof UnauthorizedException) {
        console.error(`Auth Guard Error: ${error.message}`);
        throw error;
      }
      
      console.error(`Auth Guard Unexpected Error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}