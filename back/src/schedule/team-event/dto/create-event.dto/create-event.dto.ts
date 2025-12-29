import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
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

export class CreateEventDto {

  @ApiProperty({ example: 'Math Lecture' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Detailed content of the lecture' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '2025-12-31T09:00:00.000Z', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateTime?: Date;

  @ApiPropertyOptional({ example: '2025-12-31T11:00:00.000Z', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateTime?: Date;

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateRange?: Date;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z', type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateRange?: Date;

  @ApiPropertyOptional({ example: 'lecture' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({
    example: ['monday', 'wednesday', 'friday'],
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

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  teamIds?: string[];
}
