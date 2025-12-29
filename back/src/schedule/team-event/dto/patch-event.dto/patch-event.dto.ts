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
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export enum DayOfWeek {
  Sunday = 'sunday',
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
}

export class PatchEventDto {
    
    @IsOptional()
    @IsString()
    subject?: string;
    
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date) // ← ДОБАВЬТЕ
    startDateTime?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date) 
    endDateTime?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date) 
    startDateRange?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date) 
    endDateRange?: Date;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    interval?: number;

    @IsOptional()
    @IsArray()
    @IsEnum(DayOfWeek, { each: true }) 
    @ArrayMinSize(1) 
    @ArrayMaxSize(7)
    @Transform(({ value }) => {
      if (!value) return value;
      return value.map(day => day.toLowerCase());
    })
    daysOfWeek?: DayOfWeek[];

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    @Type(() => String)
    teamIds?: string[];

}