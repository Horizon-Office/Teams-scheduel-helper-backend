import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginateOrderDto {
  @ApiProperty({ example: 1, description: 'Page number' })
  @IsNotEmpty()
  @Type(() => Number)
  page: number;

  @ApiPropertyOptional({ example: '35e4576a-9e20-4513-a5ce-caeed2c62583', description: 'Faculty UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'Faculty ID має бути валідним UUID' })
  facultyId?: string;

  @ApiPropertyOptional({ example: 'search query', description: 'Search by name' })
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 10, description: 'Items per page' })
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'Include teams' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTeams?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'Include events' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeEvents?: boolean = false;
}