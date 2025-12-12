import { Module } from '@nestjs/common';
import { TeamEventModule } from './team_event/team_event.module';
import { TeamModule } from './team/team.module';
import { OrderMemberModule } from './order_member/order_member.module';

@Module({


  imports: [TeamEventModule, TeamModule, OrderMemberModule]
})
export class ScheduleModule {}
