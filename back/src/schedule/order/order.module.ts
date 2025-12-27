import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MicrosoftGraphImportModule } from '../microsoft-graph-import/microsoft_graph_import.module';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { Order } from './entities/order.entity';
import { Team } from '../team/entities/team.entity'
import { Event } from '../team-event/entities/team_event.entity'

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [
    MicrosoftGraphImportModule,
    TypeOrmModule.forFeature([Order, Team, Event]),
  ]
})
export class OrderModule {}
