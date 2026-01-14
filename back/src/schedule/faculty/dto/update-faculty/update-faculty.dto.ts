import { PartialType } from '@nestjs/mapped-types';
import { CreateFacultyDto } from '../create-faculty/create-faculty.dto';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateFacultyDto extends PartialType(CreateFacultyDto) {
  @IsOptional()
  @IsString({ message: 'Назва має бути рядком' })
  @MaxLength(255, { message: 'Назва не може перевищувати 255 символів' })
  name?: string;
}