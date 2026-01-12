import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchTeamDto {

  @ApiPropertyOptional({ example: 'New team name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Team description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 32 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  studentCount?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weekCount?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hoursPerWeekCount?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hoursPerWeekPracticeCount?: number;

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  memberIds?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  orderIds?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  eventsIds?: string[];
}
