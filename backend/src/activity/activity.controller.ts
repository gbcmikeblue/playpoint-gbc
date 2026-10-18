import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Public } from '../common/public.decorator'
import { ActivityService } from './activity.service'

class SignupDto {
  @IsOptional()
  @IsString()
  sessionAt?: string

  @IsString()
  @MaxLength(20)
  nickname: string

  @IsInt()
  @Min(0)
  gender: number

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>
}

@ApiTags('04-活动')
@Controller('activities')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '活动详情' })
  detail(@Param('id') id: string, @Req() req: any) {
    return this.service.detail(id, req.user?.sub)
  }

  @ApiBearerAuth()
  @Post(':id/signups')
  @ApiOperation({ summary: '报名（0 元直接出票，付费返回订单号）' })
  signup(@Param('id') id: string, @Body() dto: SignupDto, @Req() req: any) {
    return this.service.signup(id, req.user.sub, dto)
  }
}
