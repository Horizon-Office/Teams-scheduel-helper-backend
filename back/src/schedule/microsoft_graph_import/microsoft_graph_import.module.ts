import { Module } from '@nestjs/common';
import { MicrosoftGraphImportController } from './microsoft_graph_import.controller';
import { MicrosoftGraphImportService } from './microsoft_graph_import.service';

@Module({
  controllers: [MicrosoftGraphImportController],
  providers: [MicrosoftGraphImportService]
})
export class MicrosoftGraphImportModule {}
