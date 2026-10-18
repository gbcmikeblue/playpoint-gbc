import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ApiBody<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    return next.handle().pipe(
      map((data) => {
        // 已手动包装的直接透传
        if (data && typeof data === 'object' && 'code' in data && 'data' in data) return data
        return {
          code: 0,
          message: 'ok',
          data: data ?? null,
          traceId: req.headers['x-trace-id'] ?? undefined,
        }
      }),
    )
  }
}
