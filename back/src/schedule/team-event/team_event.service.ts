import { 
    Injectable, 
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/team_event.entity';
import { Team } from '../team/entities/team.entity';
import { CreateEventDto } from './dto/create-event.dto/create-event.dto';
import { PaginateEventDto } from './dto/paginate-event.dto/paginate-event.dto';
import { PatchEventDto } from './dto/patch-event.dto/patch-event.dto';
import { DeleteEventDto } from './dto/delete-event.dto/delete-event.dto';
import { GetIdEventDto } from './dto/id-event.dto/id-event.dtp';
import { DayOfWeek } from './dto/create-event.dto/create-event.dto';

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
    ){}

    async CreateEvent(dto: CreateEventDto): Promise<Event> {

        const now = new Date();
        if (dto.startDateTime && dto.startDateTime < now) {
            throw new BadRequestException('Дата начала события не может быть в прошлом');
        }
        if (dto.startDateTime && dto.endDateTime && dto.endDateTime <= dto.startDateTime) {
            throw new BadRequestException('Дата окончания должна быть позже даты начала');
        }
        if (dto.type === 'recurring') {
            if (dto.startDateRange && dto.endDateRange && dto.endDateRange <= dto.startDateRange) {
                throw new BadRequestException('Конец диапазона повторения должен быть позже начала');
            }
        }

        const event = this.eventRepository.create({
            subject: dto.subject,
            content: dto.content,
            startDateTime: dto.startDateTime,
            endDateTime: dto.endDateTime,
            startDateRange: dto.startDateRange,
            endDateRange: dto.endDateRange,
            type: dto.type,
            interval: dto.interval,
            daysOfWeek: dto.daysOfWeek,
        });

        if (dto.teamIds?.length) {
            const teams = await this.teamRepository.find({
                where: { id: In(dto.teamIds) },
            });

            if (teams.length !== dto.teamIds.length) {
                throw new NotFoundException('Одна или несколько команд не найдены');
            }
            
            event.teams = teams;
        }

        return this.eventRepository.save(event);
    }

    async GetByIdEvent(dto: GetIdEventDto): Promise<Event> {
        const { id, includeTeams } = dto;

        const relations: string[] = [];

        if (includeTeams) {
            relations.push('teams');
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

        if (dto.startDateTime !== undefined) {
            const endDateTimeToCheck = dto.endDateTime !== undefined ? dto.endDateTime : event.endDateTime;
            if (endDateTimeToCheck && dto.startDateTime >= endDateTimeToCheck) {
                throw new BadRequestException('The new date must be before the end date.');
            }
        }

        if (dto.endDateTime !== undefined) {
            const startDateTimeToCheck = dto.startDateTime !== undefined ? dto.startDateTime : event.startDateTime;
            if (startDateTimeToCheck && dto.endDateTime <= startDateTimeToCheck) {
                throw new BadRequestException('The new end date must be later than the start date.');
            }
        }

        if (dto.subject !== undefined) event.subject = dto.subject;
        if (dto.content !== undefined) event.content = dto.content;
        if (dto.startDateTime !== undefined) event.startDateTime = dto.startDateTime;
        if (dto.endDateTime !== undefined) event.endDateTime = dto.endDateTime;
        if (dto.startDateRange !== undefined) event.startDateRange = dto.startDateRange;
        if (dto.endDateRange !== undefined) event.endDateRange = dto.endDateRange;
        if (dto.type !== undefined) event.type = dto.type;
        if (dto.interval !== undefined) event.interval = dto.interval;
        if (dto.daysOfWeek !== undefined) event.daysOfWeek = dto.daysOfWeek;

        if (dto.teamIds !== undefined) {
            const teams = await this.teamRepository.find({
                where: { id: In(dto.teamIds) }
            });
            
            if (teams.length !== dto.teamIds.length) {
                throw new NotFoundException('One or more teams not found');
            }
            
            event.teams = teams;
        }

        return await this.eventRepository.save(event);
    }

    async PaginateEvent(dto: PaginateEventDto): Promise<PaginatedEvent> {
        const { page, limit, includeTeams = false } = dto;
        
        const relations: string[] = [];
        if (includeTeams) {
            relations.push('teams');
        }
        
        const [data, total] = await this.eventRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations,
            order: { startDateTime: 'ASC' },
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
            where: { id }
        });
        
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        
        await this.eventRepository.remove(event);
        return { 
            message: `Event '${event.subject}' (ID: ${id}) deleted successfully` 
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
                .where('event.id IN (:...ids)', { ids: eventIds })
                .execute();
        } else {
            await queryBuilder
                .delete()
                .where('event.id IN (:...ids)', { ids: eventIds })
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
            deletedCount
        };
    }
}