import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Order } from '../order/entities/order.entity';
import { Member } from 'src/members/entities/member.entity';
import { Event } from '../team-event/entities/team_event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Order, Event, Member])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TypeOrmModule]
})
export class TeamModule {}