import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create_event.dto/create_event.dto';


@Injectable()
export class MicrosoftEventsImportService {
    private readonly ONLINE_MEETING_PROVIDER = 'teamsForBusiness';

    async createEvent(createEventDto: CreateEventDto, accessToken: string) {
        const requestBody: unknown = {
            subject: createEventDto.subject,
            start: {
                dateTime: createEventDto.start.dateTime,
                timeZone: createEventDto.start.timeZone
            },
            end: {
                dateTime: createEventDto.end.dateTime,
                timeZone: createEventDto.end.timeZone
            },
            isOnlineMeeting: createEventDto.isOnlineMeeting ?? true,
            onlineMeetingProvider: this.ONLINE_MEETING_PROVIDER,
            reminderMinutesBeforeStart: createEventDto.reminderMinutesBeforeStart ?? 15
        };

        if (createEventDto.attendees) {
            (requestBody as Record<string, unknown>).attendees = createEventDto.attendees;
        }

        if (createEventDto.body) {
            (requestBody as Record<string, unknown>).body = {
                contentType: createEventDto.body.contentType,
                content: createEventDto.body.content
            };
        }

        if (createEventDto.recurrence) {
            (requestBody as Record<string, unknown>).recurrence = {};
            
            (requestBody as Record<string, unknown>).recurrence = {
                pattern: {
                    type: createEventDto.recurrence.pattern.type,
                    interval: createEventDto.recurrence.pattern.interval,
                    daysOfWeek: createEventDto.recurrence.pattern.daysOfWeek
                },
                range: {
                    type: createEventDto.recurrence.range.type
                }
            };

            const recurrenceBody = (requestBody as Record<string, any>).recurrence;
            
            if (createEventDto.recurrence.range.startDate) {
                recurrenceBody.range.startDate = createEventDto.recurrence.range.startDate;
            }
            if (createEventDto.recurrence.range.endDate) {
                recurrenceBody.range.endDate = createEventDto.recurrence.range.endDate;
            }
            if (createEventDto.recurrence.range.numberOfOccurrences) {
                recurrenceBody.range.numberOfOccurrences = createEventDto.recurrence.range.numberOfOccurrences;
            }
        }

        const response = await fetch(`https://graph.microsoft.com/v1.0/groups/${createEventDto.teamid}/calendar/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Microsoft Graph request failed: ${response.statusText}`);
        }

        return await response.json();
    }
}
