import { Injectable, Logger } from '@nestjs/common';
import {
  CreatedGraphEvent,
  GraphEventPayload,
  MicrosoftGraphSecurityClientService,
} from 'src/client/microsoft_graph/microsoft_graph_security.service';

export type MicrosoftGraphEventCreatePayload = GraphEventPayload & {
  teacherId: string;
};

export type MicrosoftEventImportSuccessResult = {
  index: number;
  success: true;
  teacherId: string;
  eventId: string;
  joinUrl?: string;
  webLink?: string;
  subject: string;
};

export type MicrosoftEventImportErrorResult = {
  index: number;
  success: false;
  teacherId?: string;
  error: string;
  subject?: string;
};

export type MicrosoftEventImportResult =
  | MicrosoftEventImportSuccessResult
  | MicrosoftEventImportErrorResult;

export type MicrosoftEventsImportResponse = {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  results: MicrosoftEventImportResult[];
};

@Injectable()
export class MicrosoftEventsImportService {
  private readonly logger = new Logger(MicrosoftEventsImportService.name);

  constructor(
    private readonly microsoftGraphSecurityClientService: MicrosoftGraphSecurityClientService,
  ) {}

  async importEvents(
    events: MicrosoftGraphEventCreatePayload[],
  ): Promise<MicrosoftEventsImportResponse> {
    const results: MicrosoftEventImportResult[] = [];

    for (const [index, eventToCreate] of events.entries()) {
      const { teacherId, ...eventPayload } = eventToCreate;

      try {
        if (!teacherId) {
          throw new Error('teacherId is required');
        }

        const createdEvent: CreatedGraphEvent =
          await this.microsoftGraphSecurityClientService.createTeacherCalendarEvent(
            teacherId,
            eventPayload,
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

    const created = results.filter((result) => result.success).length;
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