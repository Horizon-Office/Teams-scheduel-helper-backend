import { Module } from '@nestjs/common';
import { TeamEventService } from './team_event.service';
import { TeamEventController } from './team_event.controller';

@Module({
  providers: [TeamEventService],
  controllers: [TeamEventController]
})
export class TeamEventModule {}
