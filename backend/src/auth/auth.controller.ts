import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { Public } from '../common/public.decorator'
import { AuthService } from './auth.service'

class LoginDto {
  @IsString()
  code: string

  @IsOptional()
  @IsString()
  scene?: string
}

class RefreshDto {
  @IsString()
  refreshToken: string
}

@ApiTags('01-认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '微信登录（本地无 AppID 时为 mock 登录）' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.code, dto.scene)
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '刷新 token' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }
}
