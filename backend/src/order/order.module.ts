import { Module } from '@nestjs/common'
import { TicketModule } from '../ticket/ticket.module'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'

@Module({
  imports: [TicketModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
