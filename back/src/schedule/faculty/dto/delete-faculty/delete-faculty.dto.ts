import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteFacultyDto {
  @IsOptional()
  @IsBoolean({ message: 'Параметр softDelete має бути булевим значенням' })
  softDelete?: boolean = false;
}