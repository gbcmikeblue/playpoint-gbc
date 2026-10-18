import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/public.decorator'
import { HomeService } from './home.service'

@ApiTags('03-首页')
@Controller('home')
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Public()
  @Get('feed')
  @ApiOperation({ summary: '首页聚合（banner + 分类 + 广告 + 活动列表，一次请求）' })
  feed(
    @Query('city') city?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort') sort?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.feed({ city, categoryId, sort, cursor, limit: limit ? Number(limit) : 20 })
  }
}
