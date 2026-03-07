import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DayOfWeek {
  Sunday = 'sunday',
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
}

export class CreateScheduleEventDto {

  @ApiProperty({ example: 'Math Lecture' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Detailed content of the lecture' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '08:00', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '09:30', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @ApiPropertyOptional({ example: '2025-09-01', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDateRange must be in YYYY-MM-DD format' })
  startDateRange?: string;

  @ApiPropertyOptional({ example: '2026-01-31', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDateRange must be in YYYY-MM-DD format' })
  endDateRange?: string;

  @ApiPropertyOptional({ example: 'lecture' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({
    example: ['monday', 'wednesday'],
    enum: DayOfWeek,
    isArray: true,
    minItems: 1,
    maxItems: 7,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @Transform(({ value }) => value.map(day => day.toLowerCase()))
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsUUID('4')
  teamId: string;

  @ApiPropertyOptional({ example: ['550e8400-e29b-41d4-a716-446655440000'], type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  orderIds: string[];
}