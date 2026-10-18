import { Module } from '@nestjs/common'
import { TicketModule } from '../ticket/ticket.module'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'

@Module({
  imports: [TicketModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
