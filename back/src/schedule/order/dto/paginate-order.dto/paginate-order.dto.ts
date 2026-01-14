import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginateOrderDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  page: number;

  @ApiProperty({ example: 'uuid-факультета' })
  @IsOptional()
  @IsUUID('4', { message: 'Faculty ID має бути валідним UUID' })
  facultyId?: string;

  @ApiProperty({ example: 'search query' })
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTeams?: boolean = true;
}