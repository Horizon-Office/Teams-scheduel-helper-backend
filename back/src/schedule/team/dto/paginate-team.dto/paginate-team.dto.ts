import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginateTeamDto {

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  page: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeMembers?: boolean = true;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeOrders?: boolean = true;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeEvents?: boolean = true;
}
