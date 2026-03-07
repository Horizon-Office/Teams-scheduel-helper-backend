import { Module } from '@nestjs/common';
import { MicrosoftGraphSecurityClientService } from './microsoft_graph_security.service';


@Module({
  providers: [MicrosoftGraphSecurityClientService],
  exports: [MicrosoftGraphSecurityClientService],
})

export class MicrosoftGraphClientModule {}
