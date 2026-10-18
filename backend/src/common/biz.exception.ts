import { HttpException } from '@nestjs/common'

/**
 * 业务异常：HTTP 200 + 业务码（前端按 code 分支）。
 * 错误码段位见 doc/06-m0/05-接口契约冻结清单.md
 */
export class BizException extends HttpException {
  constructor(code: number, message: string) {
    super({ code, message }, 200)
  }
}

export const ERR = {
  PARAM: 1001,
  NOT_FOUND: 1002,
  RATE_LIMIT: 1003,
  UNAUTHORIZED: 2001,
  FORBIDDEN: 2002,
  ACTIVITY_FULL: 3001,
  DUPLICATE_SIGNUP: 3002,
  ACTIVITY_CLOSED: 3003,
  CHECKIN_OUT_OF_RANGE: 4001,
  CHECKIN_DUPLICATE: 4002,
  CAMPAIGN_NOT_JOINED: 4003,
  ORDER_NOT_FOUND: 7001,
  ORDER_EXPIRED: 7002,
  ORDER_AMOUNT_MISMATCH: 7003,
} as const
