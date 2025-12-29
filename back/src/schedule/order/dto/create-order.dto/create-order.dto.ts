import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {

  @ApiProperty({ example: 'Order for CS students' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 25, minimum: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  student_count: number;

  @ApiProperty({ example: 'Computer Science' })
  @IsNotEmpty()
  @IsString()
  department: string;

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
