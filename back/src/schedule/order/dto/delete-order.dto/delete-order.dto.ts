import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';

export class DeleteOrderDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  orderIds?: string[];

  @IsOptional()
  @IsBoolean()
  softDelete?: boolean

}
