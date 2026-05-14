import { IsString, IsArray, IsNotEmpty, ValidateNested, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class OwnerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;  

  @IsString()
  @IsNotEmpty()
  id!: string;  
}

export class GroupDto {
  @IsString()
  @IsNotEmpty()
  displayName!: string;  

  @IsArray()
  @IsString({ each: true })
  departments!: string[];  

  @IsString()
  @IsOptional()
  description!: string;  

  @ValidateNested()
  @Type(() => OwnerDto)
  owner!: OwnerDto;  
}

export class CreateTeamsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Массив groups не должен быть пустым' })
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  groups!: GroupDto[];  
}