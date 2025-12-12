import { Module } from '@nestjs/common';
import { OrderMemberController } from './order_member.controller';
import { OrderMemberService } from './order_member.service';

@Module({
  controllers: [OrderMemberController],
  providers: [OrderMemberService]
})
export class OrderMemberModule {}
