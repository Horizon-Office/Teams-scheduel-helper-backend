import { 
    Injectable, 
    NotFoundException,
    BadRequestException

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';

import { Order } from './entities/order.entity';
import { Team } from '../../schedule/team/entities/team.entity';
import { Faculty } from '../../schedule/faculty/entities/faculty.entity';

import { CreateOrderDto } from './dto/create-order.dto/create-order.dto';
import { GetIdOrderDto } from './dto/id-order.dto/id-order.dto';
import { PatchOrderDto } from './dto/patch-order.dto/patch-order.dto';
import { PaginateOrderDto } from './dto/paginate-order.dto/paginate-order.dto';
import { DeleteOrderDto } from './dto/delete-order.dto/delete-order.dto';

export interface PaginatedOrders {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    search: string | undefined;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        @InjectRepository(Faculty)
        private readonly facultyRepository: Repository<Faculty>,

        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
    ) {}

   async CreateOrder(dto: CreateOrderDto): Promise<Order> {
        const order = this.orderRepository.create({
            name: dto.name,
            student_count: dto.student_count
        });

        if (dto.facultyId) {
            const faculty = await this.facultyRepository.findOne({
                where: { id: dto.facultyId }
            });
            
            if (!faculty) {
                throw new NotFoundException(`Faculty with ID ${dto.facultyId} not found`);
            }
            
            order.faculty = faculty;
        }
        if (dto.teamIds?.length) {
            const teams = await this.teamRepository.find({
                where: { id: In(dto.teamIds) },
            });

            if (teams.length !== dto.teamIds.length) {
                throw new NotFoundException('One or more teams not found');
            }

            order.teams = teams;
        }

        return this.orderRepository.save(order);
    }

    async PaginateOrder(dto: PaginateOrderDto): Promise<PaginatedOrders> {
        const { page, limit, facultyId, search, includeTeams = false } = dto;
        
        const queryBuilder = this.orderRepository.createQueryBuilder('order');
        this.applyFilters(queryBuilder, facultyId, search);

        if (includeTeams) {
            queryBuilder.leftJoinAndSelect('order.teams', 'teams');
        }
        
        queryBuilder.orderBy('order.name', 'ASC');
        
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            data,
            meta: {
                total,
                page,
                limit,
                search,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        };
    }

    private applyFilters(
      queryBuilder: SelectQueryBuilder<Order>, 
      faculty?: string, 
      search?: string
    ): void {
        if (faculty) {
            
            queryBuilder.innerJoin('order.faculty', 'faculty')
                .andWhere('faculty.id = :facultyId', { facultyId: faculty });

        } else {
            queryBuilder.leftJoinAndSelect('order.faculty', 'faculty');
        }
        
        if (search) {
            
            const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);

            if (searchWords.length > 0) {
                const orConditions = searchWords.map((word, index) => {
                    const paramName = `search${index}`;
                    queryBuilder.setParameter(paramName, `%${word}%`);
                    return `order.name ILIKE :${paramName}`;
                });
                
                queryBuilder.andWhere(`(${orConditions.join(' OR ')})`);
            }
        }
    }

    async GetByIdOrder(dto: GetIdOrderDto): Promise<Order> {
        const { id, includeTeams } = dto;
        
        const queryOptions: any = {
            where: { id }
        };
        if (includeTeams) {
            queryOptions.relations = ['teams'];
        }
        
        const order = await this.orderRepository.findOne(queryOptions);
        
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return order;
    }


    async PatchOrder(id: string, dto: PatchOrderDto): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['faculty', 'teams'] // ДОДАЄМО relations!
        });
        
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        // Оновлюємо прості поля
        if (dto.name !== undefined) {
            order.name = dto.name;
        }
        if (dto.student_count !== undefined) {
            order.student_count = dto.student_count;
        }
        
        if (dto.facultyId !== undefined) {
            const faculty = await this.facultyRepository.findOne({
                where: { id: dto.facultyId }
            });
            
            if (!faculty) {
                throw new NotFoundException(`Faculty with ID ${dto.facultyId} not found`);
            }
            
            order.faculty = faculty;
        }
        
        if (dto.teamIds !== undefined) {
            const teams = await this.teamRepository.findByIds(dto.teamIds);
            order.teams = teams;
        }

        return await this.orderRepository.save(order);
    }

    async DeleteOrder(id: string): Promise<{ message: string }> {
        const order = await this.orderRepository.findOne({
            where: { id }
        });
        
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        
        await this.orderRepository.remove(order);
        return { 
            message: `Order '${order.name}' (ID: ${id}) deleted successfully` 
        };
    }


    async DeleteMultipleOrders(dto: DeleteOrderDto): Promise<{ 
        message: string, 
        deletedCount: number 
    }> {
        const { orderIds, softDelete = false } = dto;
        
        if (!orderIds || orderIds.length === 0) {
            throw new BadRequestException('No IDs provided for deletion');
        }
        
        const queryBuilder = this.orderRepository.createQueryBuilder('order');
        
        if (softDelete) {
            await queryBuilder
                .softDelete()
                .where('order.id IN (:...ids)', { orderIds })
                .execute();
        } else {
            await queryBuilder
                .delete()
                .where('order.id IN (:...ids)', { orderIds })
                .execute();
        }
        

        const countResult = await this.orderRepository
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .where('id IN (:...ids)', { orderIds })
            .getRawOne();
        
        const remainingCount = parseInt(countResult.count);
        const deletedCount = orderIds.length - remainingCount;
        
        return { 
            message: `Deleted ${deletedCount} of ${orderIds.length} requested orders`,
            deletedCount
        };
    }

}
