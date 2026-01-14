import { Module } from '@nestjs/common';
import { MicrosoftGraphImportModule } from './microsoft-graph-import/microsoft_graph_import.module';
import { OrderModule } from './order/order.module';  
import { TeamEventModule } from './team-event/team_event.module';
import { TeamModule } from './team/team.module';
import { FacultyModule } from './faculty/faculty.module';


@Module({
  imports: [
    TeamEventModule, 
    TeamModule, 
    OrderModule, 
    MicrosoftGraphImportModule,
    FacultyModule
  ],
})
export class ScheduleModule {}
