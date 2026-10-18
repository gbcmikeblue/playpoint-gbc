import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()
    const req = host.switchToHttp().getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let body: { code: number; message: string } = { code: 5000, message: '服务器开小差了' }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const resp = exception.getResponse() as any
      if (typeof resp === 'string') {
        body = { code: status === 401 ? 2001 : 1001, message: resp }
      } else if (resp?.code !== undefined) {
        body = { code: resp.code, message: resp.message ?? 'error' }
        // 业务异常统一 200，鉴权异常保留 401 供前端续期
        if (resp.code < 2000 && status === 200) status = 200
      } else {
        const msg = Array.isArray(resp?.message) ? resp.message[0] : resp?.message
        body = { code: 1001, message: msg ?? 'error' }
        status = status === 200 ? 200 : status
      }
    } else {
      this.logger.error(`Unhandled: ${(exception as Error)?.message}`, (exception as Error)?.stack)
    }

    res.status(status).json({ ...body, data: null, path: req?.url })
  }
}
