import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  MicrosoftEventsImportResponse,
  MicrosoftEventsImportService,
  MicrosoftGraphEventCreatePayload,
} from './services/microsoft_events_import.service';

export type CreateMicrosoftEventsBody = {
  events: MicrosoftGraphEventCreatePayload[];
};

@Controller('microsoft-graph-events-import')
export class MicrosoftEventsImportController {
  constructor(
    private readonly microsoftEventsImportService: MicrosoftEventsImportService,
  ) {}

  @Post('create-events')
  async createEvents(
    @Body() body: CreateMicrosoftEventsBody,
  ): Promise<MicrosoftEventsImportResponse> {
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      throw new BadRequestException('events must be a non-empty array');
    }

    return this.microsoftEventsImportService.importEvents(events);
  }
}