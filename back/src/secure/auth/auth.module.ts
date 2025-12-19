import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MicrosoftGraphClientModule } from 'src/client/microsoft_graph/microsoft_graph.module';
import { AuthGuard } from './auth.guard';

@Global()
@Module({
  imports: [MicrosoftGraphClientModule],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController], 
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}