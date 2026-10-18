import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { BizException, ERR } from '../common/biz.exception'
import { newId } from '../common/id'

export interface WxSession {
  openid: string
  unionid?: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth')

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * 微信登录。本地无 AppID 时走 mock：openid = mock_<code>，
   * 前端每次 wx.login 的 code 不同，因此 mock 模式下用固定 code（如 'dev'）可保持同一账号。
   */
  async login(code: string, scene?: string) {
    const { openid } = await this.resolveSession(code)

    let user = await this.prisma.user.findUnique({ where: { openid } })
    let isNew = false
    if (!user) {
      isNew = true
      user = await this.prisma.user.create({
        data: { id: newId('u_'), openid, nickname: '微信用户' },
      })
    }
    if (user.status === 1) throw new BizException(2002, '账号已被限制使用')

    const token = await this.sign(user.id, openid, process.env.JWT_EXPIRES ?? '7d')
    const refreshToken = await this.sign(user.id, openid, '30d')

    return { token, refreshToken, isNew, user: this.toBrief(user) }
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; openid?: string }
    try {
      payload = await this.jwt.verifyAsync(refreshToken)
    } catch {
      throw new BizException(ERR.UNAUTHORIZED, '登录已失效，请重新登录')
    }
    const token = await this.sign(payload.sub, payload.openid ?? '', process.env.JWT_EXPIRES ?? '7d')
    return { token, refreshToken: await this.sign(payload.sub, payload.openid ?? '', '30d') }
  }

  private async sign(sub: string, openid: string, expiresIn: string) {
    return this.jwt.signAsync({ sub, openid }, { expiresIn })
  }

  private async resolveSession(code: string): Promise<WxSession> {
    const appid = process.env.WX_APPID
    const secret = process.env.WX_SECRET
    if (process.env.AUTH_MOCK === 'true' || !appid || !secret) {
      return { openid: `mock_${code || 'dev'}` }
    }
    const url =
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}` +
      `&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    const res = await fetch(url)
    const data = (await res.json()) as any
    if (!data.openid) {
      this.logger.warn(`jscode2session failed: ${JSON.stringify(data)}`)
      throw new BizException(ERR.UNAUTHORIZED, '微信登录失败，请重试')
    }
    return { openid: data.openid, unionid: data.unionid }
  }

  private toBrief(user: any) {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      mbti: user.mbti,
      hasProfile: !!(user.avatarUrl || user.about || user.signature),
    }
  }
}
