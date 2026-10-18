import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator'
import { OrderService } from './order.service'

class CreateOrderDto {
  @IsIn([1, 2])
  bizType: number

  @IsString()
  bizId: string

  @IsOptional()
  @IsString()
  signupId?: string
}

@ApiTags('05-订单与支付')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单（同业务存在待支付单时复用）' })
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.service.create(req.user.sub, dto.bizType, dto.bizId, dto.signupId)
  }

  @Get(':id')
  @ApiOperation({ summary: '收银台订单详情（含服务端时间用于倒计时）' })
  get(@Param('id') id: string, @Req() req: any) {
    return this.service.get(id, req.user.sub)
  }

  @Post(':id/mock-pay')
  @ApiOperation({ summary: '模拟支付（幂等，不接微信支付）' })
  mockPay(@Param('id') id: string, @Req() req: any) {
    return this.service.mockPay(id, req.user.sub)
  }
}
