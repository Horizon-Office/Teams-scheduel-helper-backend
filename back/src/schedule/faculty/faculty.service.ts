// src/faculty/faculty.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { CreateFacultyDto } from './dto/create-faculty/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(
    @InjectRepository(Faculty)
    private readonly facultyRepository: Repository<Faculty>,
  ) {}

  async findAll(): Promise<Faculty[]> {
    return await this.facultyRepository.find();
  }

  async findOne(id: string): Promise<Faculty> {
    const faculty = await this.facultyRepository.findOne({
      where: { id },
    });

    if (!faculty) {
      throw new NotFoundException(`Факультет з ID ${id} не знайдено`);
    }

    return faculty;
  }

  async create(createFacultyDto: CreateFacultyDto): Promise<Faculty> {
    const faculty = this.facultyRepository.create(createFacultyDto);
    return await this.facultyRepository.save(faculty);
  }
    
  async update(id: string, updateFacultyDto: UpdateFacultyDto): Promise<Faculty> {
    const faculty = await this.findOne(id);

  
    Object.assign(faculty, updateFacultyDto);

    return await this.facultyRepository.save(faculty);
  }
    
  async remove(id: string, softDelete: boolean = false): Promise<void> {
    const faculty = await this.findOne(id);

    if (softDelete) {
  
      await this.facultyRepository.softRemove(faculty);
    } else {
  
      await this.facultyRepository.remove(faculty);
    }
  }
}