import { 
    Injectable, 
    NotFoundException,
    BadRequestException

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { Team } from '../../schedule/team/entities/team.entity';

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

        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
    ) {}

    async CreateOrder(dto: CreateOrderDto): Promise<Order> {
        const order = this.orderRepository.create({
            name: dto.name,
            student_count: dto.student_count,
            department: dto.department,
        });

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
        const { page, limit } = dto;
        
        const [data, total] = await this.orderRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['teams'],
        });

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        };
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


    async patchOrder(id: string, dto: PatchOrderDto): Promise<Order> {

        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['teams']
        });
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        if (dto.name !== undefined) {
            order.name = dto.name;
        }
        if (dto.student_count !== undefined) {
            order.student_count = dto.student_count;
        }
        if (dto.department !== undefined) {
            order.department = dto.department;
        }
        
        if (dto.teamIds !== undefined) {
            const teams = await this.teamRepository.findByIds(dto.teamIds);
            order.teams = teams;
        }

        return await this.orderRepository.save(order);
    }

    async deleteOrder(id: string): Promise<{ message: string }> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['teams']
        });
        
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        
        await this.orderRepository.remove(order);
        return { 
            message: `Order '${order.name}' (ID: ${id}) deleted successfully` 
        };
    }


    async deleteMultipleOrders(dto: DeleteOrderDto): Promise<{ 
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
