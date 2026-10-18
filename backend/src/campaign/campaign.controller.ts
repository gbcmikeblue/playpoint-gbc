import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/public.decorator'
import { CampaignService } from './campaign.service'

@ApiTags('07-打卡挑战')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly service: CampaignService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '挑战赛列表' })
  list(@Query('city') city?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.service.list(city, cursor, limit ? Number(limit) : 20)
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '挑战赛详情' })
  detail(@Param('id') id: string) {
    return this.service.detail(id)
  }

  @Public()
  @Get(':id/checkpoints')
  @ApiOperation({ summary: '打卡点列表（地图本期不做）' })
  checkpoints(@Param('id') id: string) {
    return this.service.checkpoints(id)
  }
}
