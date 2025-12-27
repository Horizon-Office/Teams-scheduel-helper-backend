// get-order.dto.ts
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export class GetIdOrderDto {
    @IsUUID('4')
    id: string;
    
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    includeTeams?: boolean = true;
    
}