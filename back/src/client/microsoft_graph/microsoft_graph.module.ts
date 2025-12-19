import { Module } from '@nestjs/common';
import { MicrosoftGraphClientService } from './microsoft_graph.service';


@Module({
  providers: [MicrosoftGraphClientService],
  exports: [MicrosoftGraphClientService],
})

export class MicrosoftGraphClientModule {}
