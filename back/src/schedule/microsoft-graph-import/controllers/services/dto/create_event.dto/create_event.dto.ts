import { 
  IsString, IsBoolean, IsArray, IsNumber, IsOptional,
  IsObject, ValidateNested, IsEnum, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

class EmailAddressDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}


class AttendeeDto {
  @IsObject()
  @ValidateNested()
  @Type(() => EmailAddressDto)
  emailAddress: EmailAddressDto;

  @IsEnum(['required', 'optional'])
  type: 'required' | 'optional';
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  subject: string;
  
  @IsString()
  @IsNotEmpty()
  department: string;

  @IsOptional()
  @IsObject()
  body?: {
    contentType: 'html' | 'text';
    content: string;
  };

  @IsObject()
  start: {
    dateTime: string;
    timeZone: string;
  };

  @IsObject()
  end: {
    dateTime: string;
    timeZone: string;
  };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees: AttendeeDto[];

  @IsOptional()
  @IsBoolean()
  isOnlineMeeting?: boolean;

  @IsOptional()
  @IsObject()
  recurrence?: {
    pattern: {
      type: string;
      interval: number;
      daysOfWeek: string[];
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate?: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };

  @IsOptional()
  @IsNumber()
  reminderMinutesBeforeStart?: number;
}