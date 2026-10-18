import { Controller, Get, Param, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TicketService } from './ticket.service'

@ApiTags('06-票夹')
@ApiBearerAuth()
@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  @Get()
  @ApiOperation({ summary: '票夹列表（type: 1活动 2场地 3租赁 4打卡）' })
  list(@Req() req: any, @Query('type') type?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.service.list(req.user.sub, type ? Number(type) : undefined, cursor, limit ? Number(limit) : 20)
  }

  @Get(':id')
  @ApiOperation({ summary: '取票页（含核销二维码）' })
  detail(@Param('id') id: string, @Req() req: any) {
    return this.service.detail(id, req.user.sub)
  }
}
