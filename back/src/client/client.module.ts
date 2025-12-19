import { Module } from '@nestjs/common';
import { MicrosoftGraphClientModule } from './microsoft_graph/microsoft_graph.module';


@Module({
  imports: [
    MicrosoftGraphClientModule
  ],
})
export class ClientModule {}
