import { 
    Injectable, 
    NotFoundException,
    BadRequestException

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Member } from 'src/members/entities/member.entity';
import { Event } from '../team-event/entities/team_event.entity';
import { CreateTeamDto } from './dto/create-team.dto/create-team.dto';
import { Team } from './entities/team.entity';
import { PaginateTeamDto } from './dto/paginate-team.dto/paginate-team.dto';
import { PatchTeamDto } from './dto/patch-team.dto/patch-team.dto';
import { DeleteTeamDto } from './dto/delete-team.dto/delete-team.dto';
import { GetIdTeamDto } from './dto/id-team.dto/id-team.dtp';


export interface PaginatedTeam {
  data: Team[];
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
export class TeamService {
    constructor(

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,

        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,

        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>, 

    ){}

    async CreateTeam(dto: CreateTeamDto): Promise<Team> {
        const team = this.teamRepository.create({
            name: dto.name,
            description: dto.description,
        })

        if (dto.orderIds?.length) {
            const orders = await this.orderRepository.find({
                where: { id: In(dto.orderIds) },
            })

            if (orders.length !== dto.orderIds.length) {
                throw new NotFoundException('One or more orders not found')
            }
        }

        if (dto.eventsIds?.length) {
            const event = await this.eventRepository.find({
                where: { id: In(dto.eventsIds) },
            })

            if (event.length !== dto.eventsIds.length) {
                throw new NotFoundException('One or more events not found')
            }
        }

        if (dto.memberIds?.length) {
            const member = await this.memberRepository.find({
                where: { id: In(dto.memberIds) },
            })

            if (member.length !== dto.memberIds.length) {
                throw new NotFoundException('One or more members not found')
            }
        }

        return this.teamRepository.save(team);

    }

    async GetByIdTeam(dto: GetIdTeamDto): Promise<Team> {
        const { id, includeEvents, includeOrders, includeMembers } = dto;

        const relations: string[] = [];

        if (includeEvents) {
            relations.push('events');
        }

        if (includeMembers) {
            relations.push('members');
        }

        if (includeOrders) {
            relations.push('orders');
        }

        const team = await this.teamRepository.findOne({
            where: { id },
            relations,
        });

        if (!team) {
            throw new NotFoundException(`Team with ID ${id} not found`);
        }

        return team;
    }

    

     async PatchTeam(id: string, dto: PatchTeamDto): Promise<Team> {
    
            const team = await this.teamRepository.findOne({
                where: { id },
            });
            if (!team) {
                throw new NotFoundException(`Team with ID ${id} not found`);
            }
    
            if (dto.name !== undefined) {
                team.name = dto.name;
            }
            if (dto.description !== undefined) {
                team.description = dto.description;
            }
            if (dto.eventsIds !== undefined) {
                const events = await this.eventRepository.findByIds(dto.eventsIds);
                team.events = events;
            }
            
            if (dto.orderIds !== undefined) {
                const orders = await this.orderRepository.findByIds(dto.orderIds);
                team.orders = orders;
            }
    
            return await this.teamRepository.save(team);
        }

    async PaginateTeam(dto: PaginateTeamDto): Promise<PaginatedTeam> {
            const { page, limit, includeOrders = false, includeMembers = false, includeEvents = false  } = dto;
            
            const relations: string[] = [];

            if (includeEvents) {
                relations.push('events');
            }

            if (includeMembers) {
                relations.push('members');
            }

            if (includeOrders) {
                relations.push('orders');
            }
            
            const [data, total] = await this.teamRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: ['orders','events', 'members'],
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

        async DeleteTeam(id: string): Promise<{ message: string }> {
                const team = await this.orderRepository.findOne({
                    where: { id }
                });
                
                if (!team) {
                    throw new NotFoundException(`Order with ID ${id} not found`);
                }
                
                await this.orderRepository.remove(team);
                return { 
                    message: `Order '${team.name}' (ID: ${id}) deleted successfully` 
                };
            }
        
        
            async DeleteMultipleTeams(dto: DeleteTeamDto): Promise<{ 
                message: string, 
                deletedCount: number 
            }> {
                const { teamIds, softDelete = false } = dto;
                
                if (!teamIds || teamIds.length === 0) {
                    throw new BadRequestException('No IDs provided for deletion');
                }
                
                const queryBuilder = this.teamRepository.createQueryBuilder('team');
                
                if (softDelete) {
                    await queryBuilder
                        .softDelete()
                        .where('order.id IN (:...ids)', { teamIds })
                        .execute();
                } else {
                    await queryBuilder
                        .delete()
                        .where('order.id IN (:...ids)', { teamIds })
                        .execute();
                }
                
        
                const countResult = await this.teamRepository
                    .createQueryBuilder()
                    .select('COUNT(*)', 'count')
                    .where('id IN (:...ids)', { teamIds })
                    .getRawOne();
                
                const remainingCount = parseInt(countResult.count);
                const deletedCount = teamIds.length - remainingCount;
                
                return { 
                    message: `Deleted ${deletedCount} of ${teamIds.length} requested orders`,
                    deletedCount
                };
            }
}
