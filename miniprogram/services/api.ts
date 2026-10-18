import { request } from './request'

export interface FeedParams {
  city?: string
  categoryId?: string
  sort?: string
  cursor?: string
  limit?: number
}

export const api = {
  // 认证
  login: (code: string) =>
    request<{ token: string; refreshToken: string; isNew: boolean; user: any }>({
      url: '/auth/login',
      method: 'POST',
      data: { code },
      auth: false,
      silent: true,
    }),

  // 基础
  config: () => request<any>({ url: '/app/config', auth: false, silent: true }),
  cities: () => request<any>({ url: '/app/cities', auth: false }),
  agreement: (type: 'user' | 'privacy') => request<any>({ url: `/app/agreement?type=${type}`, auth: false }),
  consent: (docVersion: string) =>
    request<any>({
      url: '/app/privacy-consent',
      method: 'POST',
      data: { docVersion, action: 'agree' },
      silent: true,
    }),

  // 首页
  homeFeed: (p: FeedParams) => {
    const q = Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&')
    return request<any>({ url: `/home/feed${q ? `?${q}` : ''}`, auth: false })
  },

  // 活动
  activityDetail: (id: string) => request<any>({ url: `/activities/${id}` }),
  signup: (id: string, data: { sessionAt?: string; nickname: string; gender: number; avatarUrl?: string }) =>
    request<any>({ url: `/activities/${id}/signups`, method: 'POST', data }),

  // 订单 / 模拟支付
  createOrder: (data: { bizType: number; bizId: string; signupId?: string }) =>
    request<any>({ url: '/orders', method: 'POST', data }),
  orderDetail: (id: string) => request<any>({ url: `/orders/${id}` }),
  mockPay: (id: string) => request<any>({ url: `/orders/${id}/mock-pay`, method: 'POST', data: {} }),

  // 票
  tickets: (type?: number) =>
    request<any>({ url: `/tickets${type ? `?type=${type}` : ''}` }),
  ticketDetail: (id: string) => request<any>({ url: `/tickets/${id}` }),

  // 挑战赛
  campaigns: (city?: string) => request<any>({ url: `/campaigns${city ? `?city=${city}` : ''}`, auth: false }),
  campaignDetail: (id: string) => request<any>({ url: `/campaigns/${id}`, auth: false }),
  checkpoints: (id: string) => request<any>({ url: `/campaigns/${id}/checkpoints`, auth: false }),
}
