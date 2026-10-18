import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from './public.decorator'

export interface JwtPayload {
  sub: string
  openid?: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const req = context.switchToHttp().getRequest()
    const header = (req.headers.authorization as string) ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined

    if (token) {
      try {
        req.user = await this.jwt.verifyAsync<JwtPayload>(token)
      } catch {
        // token 无效时不立即抛错，交给下面的 isPublic 判断
      }
    }

    if (isPublic) return true
    if (!req.user) throw new UnauthorizedException({ code: 2001, message: '登录已失效，请重新登录' })
    return true
  }
}
