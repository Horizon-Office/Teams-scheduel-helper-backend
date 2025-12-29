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

export class DeleteEventDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  eventIds?: string[];

  @IsOptional()
  @IsBoolean()
  softDelete?: boolean

}
