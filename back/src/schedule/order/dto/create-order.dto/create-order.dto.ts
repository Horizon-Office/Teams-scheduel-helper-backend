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

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  student_count: number;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  teamIds?: string[];
}
