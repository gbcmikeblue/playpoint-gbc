import { env } from '../config/env'
import { KEYS, get, remove, set } from '../utils/storage'
import { mockCall, mockEnabled } from './mock'

export interface ApiRes<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

let refreshing: Promise<boolean> | null = null

function raw<T>(opts: WechatMiniprogram.RequestOption) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      ...opts,
      success: (res) => resolve(res as unknown as T),
      fail: (err) => reject(err),
    })
  })
}

function authHeader(): Record<string, string> {
  const token = get<string>(KEYS.token)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function refreshToken(): Promise<boolean> {
  if (refreshing) return refreshing
  const rt = get<string>(KEYS.refreshToken)
  if (!rt) return false
  refreshing = (async () => {
    try {
      const res: any = await raw<any>({
        url: `${env.baseURL}/auth/refresh`,
        method: 'POST',
        data: { refreshToken: rt },
        header: { 'content-type': 'application/json' },
        timeout: 10000,
      })
      if (res.statusCode === 200 && res.data?.code === 0) {
        set(KEYS.token, res.data.data.token)
        set(KEYS.refreshToken, res.data.data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  data?: Record<string, any>
  auth?: boolean
  silent?: boolean
  /** 内部使用：是否已经重试过 */
  retried?: boolean
}

export async function request<T = any>(o: RequestOptions): Promise<T> {
  // Mock 命中则直接返回本地数据：真机预览没有后端也能跑通全链路
  if (mockEnabled()) {
    const r = await mockCall(o)
    if (r.hit) {
      if (r.error) {
        if (!o.silent) wx.showToast({ title: r.error.message, icon: 'none' })
        throw new ApiError(r.error.code, r.error.message)
      }
      return r.data as T
    }
  }

  const header: Record<string, string> = { 'content-type': 'application/json', ...authHeader() }

  let res: any
  try {
    res = await raw<any>({
      url: `${env.baseURL}${o.url}`,
      method: (o.method ?? 'GET') as any,
      data: o.data,
      header,
      timeout: 10000,
    })
  } catch (e) {
    if (!o.silent) wx.showToast({ title: '网络不太好，请重试', icon: 'none' })
    throw new ApiError(-1, 'NETWORK')
  }

  if (res.statusCode === 401 && o.auth !== false && !o.retried) {
    const ok = await refreshToken()
    if (ok) return request<T>({ ...o, retried: true })
    remove(KEYS.token)
    remove(KEYS.refreshToken)
    if (!o.silent) wx.showToast({ title: '登录已失效', icon: 'none' })
    throw new ApiError(2001, 'UNAUTHORIZED')
  }

  if (res.statusCode !== 200) {
    if (!o.silent) wx.showToast({ title: `服务异常(${res.statusCode})`, icon: 'none' })
    throw new ApiError(res.statusCode, 'HTTP_ERROR')
  }

  const body = res.data as ApiRes<T>
  if (!body || typeof body.code !== 'number') throw new ApiError(-2, 'BAD_RESPONSE')

  if (body.code !== 0) {
    if (!o.silent) wx.showToast({ title: body.message || '操作失败', icon: 'none' })
    throw new ApiError(body.code, body.message)
  }

  return body.data
}
