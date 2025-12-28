// get-order.dto.ts
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export class GetIdTeamDto {
    @IsUUID('4')
    id: string;
    
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    includeOrders?: boolean = true;
    
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    includeEvents?: boolean = true;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    includeMembers?: boolean = true;
    
}