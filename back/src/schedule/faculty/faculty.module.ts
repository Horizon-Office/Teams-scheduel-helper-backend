import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultyController } from './faculty.controller';
import { FacultyService } from './faculty.service';
import { Faculty } from './entities/faculty.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  controllers: [FacultyController],
  providers: [FacultyService],
  imports: [
    TypeOrmModule.forFeature([Faculty, Order]),
  ],
  exports: [
    TypeOrmModule,
    FacultyService, 
  ]
})
export class FacultyModule {}