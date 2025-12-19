import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MicrosoftGraphImportModule } from '../microsoft_graph_import/microsoft_graph_import.module';


@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [MicrosoftGraphImportModule]
})
export class OrderModule {}
