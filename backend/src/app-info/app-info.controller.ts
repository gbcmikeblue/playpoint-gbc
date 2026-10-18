import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsIn, IsString } from 'class-validator'
import { Public } from '../common/public.decorator'
import { AppInfoService } from './app-info.service'

class ConsentDto {
  @IsString()
  docVersion: string

  @IsIn(['agree', 'disagree'])
  action: 'agree' | 'disagree'
}

@ApiTags('02-基础')
@Controller('app')
export class AppInfoController {
  constructor(private readonly service: AppInfoService) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: '应用配置（版本/协议版本/分类/热门城市）' })
  config() {
    return this.service.getConfig()
  }

  @Public()
  @Get('cities')
  @ApiOperation({ summary: '城市列表（定位/热门/字母分组）' })
  cities() {
    return this.service.getCities()
  }

  @Public()
  @Get('agreement')
  @ApiOperation({ summary: '协议富文本' })
  agreement(@Query('type') type = 'user') {
    return this.service.getAgreement(type)
  }

  @Post('privacy-consent')
  @ApiOperation({ summary: '记录隐私授权' })
  consent(@Body() dto: ConsentDto, @Req() req: any) {
    return this.service.recordConsent(req.user?.sub, dto.docVersion, dto.action)
  }
}
