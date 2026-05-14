import { Injectable, Logger } from '@nestjs/common';
import {
  CreatedGraphEvent,
  GraphEventPayload,
  MicrosoftGraphSecurityClientService,
} from 'src/client/microsoft_graph/microsoft_graph_security.service';
import {
  CreateEventDto,
  EventImportErrorResultDto,
  EventImportSuccessResultDto,
  EventsImportResponseDto,
} from './dto/create_event.dto/create_event.dto';

@Injectable()
export class MicrosoftEventsImportService {
  private readonly logger = new Logger(MicrosoftEventsImportService.name);

  constructor(
    private readonly microsoftGraphSecurityClientService: MicrosoftGraphSecurityClientService,
  ) {}

  async importEvents(
    events: CreateEventDto[],
  ): Promise<EventsImportResponseDto> {
    const results: (EventImportSuccessResultDto | EventImportErrorResultDto)[] = [];

    for (const [index, eventToCreate] of events.entries()) {
      const { teacherId, ...eventPayload } = eventToCreate;

      try {
        if (!teacherId) {
          throw new Error('teacherId is required');
        }

        const createdEvent: CreatedGraphEvent =
          await this.microsoftGraphSecurityClientService.createTeacherCalendarEvent(
            teacherId,
            eventPayload as GraphEventPayload,
          );

        results.push({
          index,
          success: true,
          teacherId,
          eventId: createdEvent.id,
          joinUrl: createdEvent.onlineMeeting?.joinUrl,
          webLink: createdEvent.webLink,
          subject: createdEvent.subject,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);

        this.logger.error(
          `Failed to import Microsoft event at index ${index}: ${message}`,
        );

        results.push({
          index,
          success: false,
          teacherId,
          error: message,
          subject: eventToCreate.subject,
        });
      }
    }

    const created = results.filter((r) => r.success).length;
    const failed = results.length - created;

    return {
      success: failed === 0,
      total: events.length,
      created,
      failed,
      results,
    };
  }
}