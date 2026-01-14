// src/faculty/faculty.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty/update-faculty.dto';
import { DeleteFacultyDto } from './dto/delete-faculty/delete-faculty.dto';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async getAll() {
    return await this.facultyService.findAll();
  }


  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.facultyService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFacultyDto: CreateFacultyDto) {
    return await this.facultyService.create(createFacultyDto);
  }


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFacultyDto: UpdateFacultyDto,
  ) {
    return await this.facultyService.update(id, updateFacultyDto);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query() deleteFacultyDto: DeleteFacultyDto,
  ) {
    await this.facultyService.remove(id, deleteFacultyDto.softDelete);
  }
}