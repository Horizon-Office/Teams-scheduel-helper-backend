import { Module } from '@nestjs/common';
import { MicrosoftGraphImportModule } from './microsoft_graph_import/microsoft_graph_import.module';
import { OrderModule } from './order/order.module';  
import { TeamEventModule } from './team_event/team_event.module';
import { TeamModule } from './team/team.module';
import { OrderMemberModule } from './order_member/order_member.module';


@Module({
  imports: [
    TeamEventModule, 
    TeamModule, 
    OrderMemberModule, 
    OrderModule, 
    MicrosoftGraphImportModule,
  ],
})
export class ScheduleModule {}
