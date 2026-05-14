import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class EventDateTimeDto {
  @IsString()
  @IsNotEmpty()
  dateTime!: string;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;
}

class EventBodyDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string; // 'HTML' | 'text'

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
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  teacherId!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ValidateNested()
  @Type(() => EventBodyDto)
  body!: EventBodyDto;          // ← добавить

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
  results!: (EventImportSuccessResultDto | EventImportErrorResultDto)[];
}