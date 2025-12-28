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

export class PaginateTeamDto {
    
    @IsNotEmpty()
    @Type(() => Number)
    page: number;
    
    @IsNotEmpty()
    @Type(() => Number)
    limit: number;

}
