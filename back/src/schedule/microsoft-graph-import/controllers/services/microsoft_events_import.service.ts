import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create_event.dto/create_event.dto';
import { MicrosoftGraphSecurityClientService } from 'src/client/microsoft_graph/microsoft_graph_security.service';
import { getMembersByDepartment } from '../../util/teams-members.helper';

@Injectable()
export class MicrosoftEventsImportService {
  private readonly ONLINE_MEETING_PROVIDER = 'teamsForBusiness';

  constructor(
    private readonly microsoftGraphClient: MicrosoftGraphSecurityClientService,
  ) {}

  async createEvent(createEventDto: CreateEventDto, teacherId: string) {
    const [appToken, members] = await Promise.all([
      this.microsoftGraphClient.getAppToken(),
      getMembersByDepartment(this.microsoftGraphClient, createEventDto.department),
    ]);

    console.log(
      `Dept "${createEventDto.department}": ${members.length} members found, teacherId=${teacherId}`,
    );

    // Все члены департамента кроме организатора — как attendees
    const attendees = members
      .filter((m) => m.id !== teacherId && m.mail)
      .map((m) => ({
        emailAddress: {
          address: m.mail,
          name: m.displayName,
        },
        type: 'required' as const,
      }));

    console.log(`Attendees count: ${attendees.length}`);

    const requestBody: Record<string, unknown> = {
      subject: createEventDto.subject,
      start: {
        dateTime: createEventDto.start.dateTime,
        timeZone: createEventDto.start.timeZone,
      },
      end: {
        dateTime: createEventDto.end.dateTime,
        timeZone: createEventDto.end.timeZone,
      },
      isOnlineMeeting: createEventDto.isOnlineMeeting ?? true,
      onlineMeetingProvider: this.ONLINE_MEETING_PROVIDER,
      reminderMinutesBeforeStart: createEventDto.reminderMinutesBeforeStart ?? 15,
      responseRequested: true,
      attendees, // ← Graph автоматически разошлёт инвайты всем
    };

    if (createEventDto.body) {
      requestBody.body = {
        contentType: createEventDto.body.contentType,
        content: createEventDto.body.content,
      };
    }

    if (createEventDto.recurrence) {
      requestBody.recurrence = {
        pattern: {
          type: createEventDto.recurrence.pattern.type,
          interval: createEventDto.recurrence.pattern.interval,
          daysOfWeek: createEventDto.recurrence.pattern.daysOfWeek,
        },
        range: {
          type: createEventDto.recurrence.range.type,
          ...(createEventDto.recurrence.range.startDate && {
            startDate: createEventDto.recurrence.range.startDate,
          }),
          ...(createEventDto.recurrence.range.endDate && {
            endDate: createEventDto.recurrence.range.endDate,
          }),
          ...(createEventDto.recurrence.range.numberOfOccurrences && {
            numberOfOccurrences: createEventDto.recurrence.range.numberOfOccurrences,
          }),
        },
      };
    }

    // Создаём ОДНО событие только у организатора
    // Graph сам рассылает инвайты attendees — никаких дублей
    return this.postEvent(teacherId, requestBody, appToken);
  }

  private async postEvent(
    userId: string,
    body: Record<string, unknown>,
    token: string,
  ) {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Graph API failed for user ${userId}: ${JSON.stringify(error)}`,
      );
    }

    return response.json();
  }
}