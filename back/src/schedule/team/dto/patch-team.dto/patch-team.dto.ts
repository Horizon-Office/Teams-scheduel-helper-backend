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

export class PatchTeamDto {
    
    @IsOptional()
    @IsString()
    name?: string;
    
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    @Type(() => String)
    memberIds?: string[];

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    @Type(() => String)
    orderIds?: string[];

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    @Type(() => String)
    eventsIds?: string[];

}
