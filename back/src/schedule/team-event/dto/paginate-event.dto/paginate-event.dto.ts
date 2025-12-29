import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginateEventDto {
    
    @IsNotEmpty()
    @Type(() => Number)
    page: number;
    
    @IsNotEmpty()
    @Type(() => Number)
    limit: number;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    includeTeams?: boolean = false;
      

}
