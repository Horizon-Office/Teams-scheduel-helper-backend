
import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetIdTeamDto {


  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeOrders?: boolean = false;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeEvents?: boolean = false;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeMembers?: boolean = false;
}

export type GetIdTeamServiceDto = GetIdTeamDto & { id: string };