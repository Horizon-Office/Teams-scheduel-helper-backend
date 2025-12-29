import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginateEventDto {

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  page: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTeams?: boolean = false;
}
