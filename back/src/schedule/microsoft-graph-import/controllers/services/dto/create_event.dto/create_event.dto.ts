import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class EventDateTimeDto {
  @IsString()
  @IsNotEmpty()
  dateTime!: string;

  // Microsoft Graph использует Windows Time Zone IDs,
  // например: "FLE Standard Time"
  @IsString()
  @IsNotEmpty()
  timeZone!: string;
}

class EventBodyDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string; // "text" | "html"

  @IsString()
  @IsNotEmpty()
  content!: string;
}

class EventAttendeeEmailDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  name?: string;
}

class EventAttendeeDto {
  @ValidateNested()
  @Type(() => EventAttendeeEmailDto)
  emailAddress!: EventAttendeeEmailDto;

  // required | optional | resource
  @IsString()
  @IsOptional()
  type?: 'required' | 'optional' | 'resource';
}

class RecurrencePatternDto {
  @IsString()
  @IsNotEmpty()
  type!: string; // daily | weekly | absoluteMonthly | ...

  // Каждые N единиц (например 1 = каждую неделю)
  @IsInt()
  interval!: number;

  // Для weekly
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  daysOfWeek?: string[];
}

class RecurrenceRangeDto {
  @IsString()
  @IsNotEmpty()
  type!: string; // noEnd | endDate | numbered

  // Формат YYYY-MM-DD
  @IsString()
  @IsNotEmpty()
  startDate!: string;

  // Для endDate
  @IsString()
  @IsOptional()
  endDate?: string;

  // Для numbered
  @IsInt()
  @IsOptional()
  numberOfOccurrences?: number;
}

class RecurrenceDto {
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  pattern!: RecurrencePatternDto;

  @ValidateNested()
  @Type(() => RecurrenceRangeDto)
  range!: RecurrenceRangeDto;
}

export class CreateEventDto {
  // UPN или userId преподавателя
  @IsString()
  @IsNotEmpty()
  teacherId!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ValidateNested()
  @Type(() => EventBodyDto)
  body!: EventBodyDto;

  @ValidateNested()
  @Type(() => EventDateTimeDto)
  start!: EventDateTimeDto;

  @ValidateNested()
  @Type(() => EventDateTimeDto)
  end!: EventDateTimeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttendeeDto)
  @IsOptional()
  attendees?: EventAttendeeDto[];

  // Позволяет указать:
  // - weekly
  // - interval: 1 (каждую неделю)
  // - daysOfWeek: ["monday"]
  @ValidateNested()
  @Type(() => RecurrenceDto)
  @IsOptional()
  recurrence?: RecurrenceDto;

  // Создать Teams meeting
  @IsBoolean()
  @IsOptional()
  isOnlineMeeting?: boolean;

  // teamsForBusiness
  @IsString()
  @IsOptional()
  onlineMeetingProvider?: 'teamsForBusiness';

  @IsInt()
  @IsOptional()
  reminderMinutesBeforeStart?: number;
}

export class ImportEventsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEventDto)
  events!: CreateEventDto[];
}

export class EventImportSuccessResultDto {
  index!: number;
  success!: true;
  teacherId!: string;
  eventId!: string;
  joinUrl?: string;
  webLink?: string;
  subject!: string;
}

export class EventImportErrorResultDto {
  index!: number;
  success!: false;
  teacherId?: string;
  error!: string;
  subject?: string;
}

export class EventsImportResponseDto {
  success!: boolean;
  total!: number;
  created!: number;
  failed!: number;
  results!: (
    | EventImportSuccessResultDto
    | EventImportErrorResultDto
  )[];
}