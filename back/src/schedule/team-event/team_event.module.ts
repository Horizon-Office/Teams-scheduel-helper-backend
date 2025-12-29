import { Module } from '@nestjs/common';
import { TeamEventService } from './team_event.service';
import { TeamEventController } from './team_event.controller';
import { Team } from '../team/entities/team.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/team_event.entity';

@Module({
  imports: [ TypeOrmModule.forFeature([Team, Event])],
  providers: [TeamEventService],
  controllers: [TeamEventController],
  exports:[TypeOrmModule]
})
export class TeamEventModule {}
