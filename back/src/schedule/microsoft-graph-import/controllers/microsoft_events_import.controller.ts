import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MicrosoftEventsImportService } from './services/microsoft_events_import.service';
import {
  ImportEventsDto,
  EventsImportResponseDto,
} from './services/dto/create_event.dto/create_event.dto';

@Controller('microsoft/events')
export class MicrosoftEventsImportController {
  constructor(
    private readonly microsoftEventsImportService: MicrosoftEventsImportService,
  ) {}

  @Post('create-events')
  @HttpCode(HttpStatus.OK)
  async importEvents(
    @Body() dto: ImportEventsDto,
  ): Promise<EventsImportResponseDto> {
    return this.microsoftEventsImportService.importEvents(dto.events);
  }
}