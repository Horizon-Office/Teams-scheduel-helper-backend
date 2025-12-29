import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteEventDto {

  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  eventIds: string[];

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  softDelete?: boolean;
}
