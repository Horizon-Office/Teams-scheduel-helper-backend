import { Module } from '@nestjs/common';
import { MicrosoftTeamsImportController } from './controllers/microsoft_teams_import.controller';
import { MicrosoftEventsImportController } from './controllers/microsoft_events_import.controller';
import { MicrosoftTeamsImportService } from './controllers/services/microsoft_teams_import.service';
import { MicrosoftEventsImportService } from './controllers/services/microsoft_events_import.service'


@Module({
  controllers: [
  MicrosoftTeamsImportController,
  MicrosoftEventsImportController,
  ],
  providers: [
  MicrosoftTeamsImportService,
  MicrosoftEventsImportService
]
})
export class MicrosoftGraphImportModule {}
