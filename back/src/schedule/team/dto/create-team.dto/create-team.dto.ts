import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleTeamDto  {
  @ApiProperty({ example: 'Backend Team', description: 'Назва команди' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Team responsible for backend services', description: 'Опис команди' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 32, description: 'Кількість студентів у команді' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  studentCount?: number;

  @ApiPropertyOptional({ example: 12, description: 'Кількість тижнів' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weekCount?: number;

  @ApiPropertyOptional({ example: 40, description: 'Годин на тиждень (всього)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hoursPerWeekCount?: number;

  @ApiPropertyOptional({ example: 20, description: 'Годин на тиждень — практика/лабораторні' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hoursPerWeekPracticeCount?: number;

  @ApiPropertyOptional({ example: '1 , 2', description: 'Квартал: "1", "2", або "1 , 2"' })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({ example: 2, description: 'Години лекцій' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lectureHours?: number;

  @ApiPropertyOptional({ example: 'лаб', description: 'Тип практики: "лаб", "пр.р" або ""' })
  @IsOptional()
  @IsString()
  practiceType?: string;

  @ApiPropertyOptional({ example: 'Сафаров О.О., доцент', description: 'Викладач лекцій' })
  @IsOptional()
  @IsString()
  teacherLecture?: string;

  @ApiPropertyOptional({ example: 'Сафаров О.О., доцент', description: 'Викладач практики' })
  @IsOptional()
  @IsString()
  teacherPractice?: string;

  @ApiPropertyOptional({ example: 0, description: 'Розміщені години' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  placedHours?: number;

  @ApiPropertyOptional({
  example: ['ІПЗ-31', 'ІПЗ-32'],
  type: [String],
  description: 'Назви лекційних груп (якщо ще немає в системі)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  groups?: string[];

  @ApiPropertyOptional({
    example: ['ІПЗ-31/1', 'ІПЗ-31/2'],
    type: [String],
    description: 'Назви практичних груп (якщо ще немає в системі)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  practiceGroups?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
    description: 'UUID користувачів-членів команди',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  memberIds?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
    description: 'UUID ордерів/груп (many-to-many)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  orderIds?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
    description: 'UUID практичних ордерів/підгруп',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  practiceOrderIds?: string[];

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440002'],
    type: [String],
    description: 'UUID подій (events)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  eventsIds?: string[];
}