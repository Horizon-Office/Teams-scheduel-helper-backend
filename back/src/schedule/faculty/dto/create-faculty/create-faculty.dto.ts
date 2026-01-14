import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateFacultyDto {
  @IsString({ message: 'Назва має бути рядком' })
  @IsNotEmpty({ message: 'Назва не може бути порожньою' })
  @MaxLength(255, { message: 'Назва не може перевищувати 255 символів' })
  name: string;
}