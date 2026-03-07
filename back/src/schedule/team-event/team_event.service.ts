import { 
    Injectable, 
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/team_event.entity';
import { Team } from '../team/entities/team.entity';
import { Order } from '../order/entities/order.entity';
import { CreateScheduleEventDto } from './dto/create-event.dto/create-event.dto';
import { PaginateEventDto } from './dto/paginate-event.dto/paginate-event.dto';
import { PatchEventDto } from './dto/patch-event.dto/patch-event.dto';
import { DeleteEventDto } from './dto/delete-event.dto/delete-event.dto';
import { GetIdEventDto } from './dto/id-event.dto/id-event.dtp';

export interface PaginatedEvent {
  data: Event[];
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
export class TeamEventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,

        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ){}

    async CreateEvent(dto: CreateScheduleEventDto): Promise<Event> {
        const event = this.eventRepository.create({
            subject:        dto.subject,
            content:        dto.content,
            startTime:      dto.startTime,
            endTime:        dto.endTime,
            startDateRange: dto.startDateRange,
            endDateRange:   dto.endDateRange,
            type:           dto.type,
            interval:       dto.interval,
            daysOfWeek:     dto.daysOfWeek,
        });

        // Одна команда — ManyToOne
        if (dto.teamId) {
            const team = await this.teamRepository.findOne({ where: { id: dto.teamId } });
            if (!team) throw new NotFoundException(`Team ${dto.teamId} not found`);
            event.team = team;
        }

        // Ордери — ManyToMany, залишається як було
        if (dto.orderIds?.length) {
            const orders = await this.orderRepository.find({
                where: { id: In(dto.orderIds) },
            });
            if (orders.length !== dto.orderIds.length) {
                throw new NotFoundException('One or more orders not found');
            }
            event.orders = orders;
        }

        return this.eventRepository.save(event);
    }

    async GetByIdEvent(dto: GetIdEventDto): Promise<Event> {
        const { id, includeTeams } = dto;

        const relations: string[] = [];
        if (includeTeams) {
            relations.push('team'); // було 'teams'
        }

        const event = await this.eventRepository.findOne({
            where: { id },
            relations,
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return event;
    }

    async PatchEvent(id: string, dto: PatchEventDto): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        if (dto.startTime !== undefined && dto.endTime !== undefined) {
            if (dto.endTime <= dto.startTime) {
                throw new BadRequestException('endTime must be later than startTime');
            }
        }

        if (dto.subject !== undefined)        event.subject        = dto.subject;
        if (dto.content !== undefined)        event.content        = dto.content;
        if (dto.startTime !== undefined)      event.startTime      = dto.startTime;
        if (dto.endTime !== undefined)        event.endTime        = dto.endTime;
        if (dto.startDateRange !== undefined) event.startDateRange = dto.startDateRange;
        if (dto.endDateRange !== undefined)   event.endDateRange   = dto.endDateRange;
        if (dto.type !== undefined)           event.type           = dto.type;
        if (dto.interval !== undefined)       event.interval       = dto.interval;
        if (dto.daysOfWeek !== undefined)     event.daysOfWeek     = dto.daysOfWeek;

        // Одна команда — ManyToOne
        if (dto.teamId !== undefined) {
            const team = await this.teamRepository.findOne({ where: { id: dto.teamId } });
            if (!team) throw new NotFoundException(`Team ${dto.teamId} not found`);
            event.team = team;
        }

        // Ордери — ManyToMany, залишається як було
        if (dto.orderIds !== undefined) {
            const orders = await this.orderRepository.find({
                where: { id: In(dto.orderIds) },
            });
            if (orders.length !== dto.orderIds.length) {
                throw new NotFoundException('One or more orders not found');
            }
            event.orders = orders;
        }

        return await this.eventRepository.save(event);
    }

    async PaginateEvent(dto: PaginateEventDto): Promise<PaginatedEvent> {
        const { page, limit, includeTeams = false, includeOrders = false } = dto;

        const relations: string[] = [];
        if (includeTeams)  relations.push('team');   // було 'teams'
        if (includeOrders) relations.push('orders');

        const [data, total] = await this.eventRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations,
            order: { startTime: 'ASC' },
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

    async DeleteEvent(id: string): Promise<{ message: string }> {
        const event = await this.eventRepository.findOne({
            where: { id },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        await this.eventRepository.remove(event);
        return {
            message: `Event '${event.subject}' (ID: ${id}) deleted successfully`,
        };
    }

    async DeleteMultipleEvents(dto: DeleteEventDto): Promise<{ 
        message: string, 
        deletedCount: number 
    }> {
        const { eventIds, softDelete = false } = dto;

        if (!eventIds || eventIds.length === 0) {
            throw new BadRequestException('No IDs provided for deletion');
        }

        const queryBuilder = this.eventRepository.createQueryBuilder('event');

        if (softDelete) {
            await queryBuilder
                .softDelete()
                .from(Event)
                .where('id IN (:...ids)', { ids: eventIds }) // ← убрать 'event.'
                .execute();
        } else {
            await queryBuilder
                .delete()
                .from(Event)
                .where('id IN (:...ids)', { ids: eventIds }) // ← убрать 'event.'
                .execute();
        }

        const countResult = await this.eventRepository
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .where('id IN (:...ids)', { ids: eventIds })
            .getRawOne();

        const remainingCount = parseInt(countResult.count);
        const deletedCount = eventIds.length - remainingCount;

        return {
            message: `Deleted ${deletedCount} of ${eventIds.length} requested events`,
            deletedCount,
        };
    }
}
