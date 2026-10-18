/**
 * 请求层 Mock：命中路由时直接返回本地数据，不走网络。
 * 打开方式（优先级从高到低）：
 *   1) storage `pp_mock` = 'on' | 'off'（我的页 / dev 页可切换）
 *   2) config/env.ts 里各环境的 mock 开关（develop 默认开）
 * 返回结构与后端契约同构，关掉 mock 后页面代码无需改动。
 */
import { env } from '../../config/env'
import { KEYS, get, set } from '../../utils/storage'
import {
  activities,
  appConfig,
  campaigns,
  categories,
  checkpoints,
  cities,
  demoUser,
  host,
  initialTickets,
  type MockActivity,
} from './data'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const STATE_KEY = 'pp_mock_state'

interface MockState {
  signups: { id: string; activityId: string; sessionAt: string; nickname: string; gender: number; avatarUrl?: string; status: number; orderId?: string }[]
  orders: {
    id: string
    orderNo: string
    bizType: number
    bizId: string
    signupId?: string
    title: string
    coverUrl?: string
    amountCent: number
    status: number
    paidAt?: string
    expireAt: string
  }[]
  tickets: any[]
  consentVersion?: string
}

function loadState(): MockState {
  const s = get<MockState>(STATE_KEY)
  if (s) return s
  return { signups: [], orders: [], tickets: initialTickets.map((t) => ({ ...t })) }
}

let state: MockState = loadState()

function save() {
  set(STATE_KEY, state)
}

export function resetMockState() {
  state = { signups: [], orders: [], tickets: initialTickets.map((t) => ({ ...t })) }
  save()
}

export function mockEnabled(): boolean {
  const v = get<string>(KEYS.mock)
  if (v === 'on') return true
  if (v === 'off') return false
  return !!env.mock
}

export function setMockEnabled(on: boolean) {
  set(KEYS.mock, on ? 'on' : 'off')
}

// ---------- 工具 ----------

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const ymd = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const hm = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const md = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}
const mdh = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${hm(iso)}`
}
const sessionText = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${WEEK[d.getDay()]}${md(iso)} ${hm(iso)}`
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`
}

function orderNo() {
  const d = new Date()
  return `PP${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${Date.now().toString().slice(-6)}`
}

// ---------- 视图转换（与后端一致） ----------

function toCard(a: MockActivity) {
  const tags = a.tags ?? []
  const d = new Date(a.startAt)
  const now = new Date()
  return {
    id: a.id,
    type: 'activity',
    coverUrl: a.coverUrl,
    title: a.title,
    startAt: a.startAt,
    dateText: md(a.startAt),
    isToday: ymd(a.startAt) === ymd(now.toISOString()),
    timeText: hm(a.startAt),
    weekText: WEEK[d.getDay()],
    poiName: a.poiName,
    district: a.address ?? null,
    distanceText: null,
    priceCent: a.priceCent,
    priceText: a.priceCent === 0 ? '免费' : `¥${a.priceCent / 100}`,
    joinedCount: a.joinedCount,
    capacity: a.capacity,
    tags,
    host: null,
    cornerText: null,
  }
}

function joinStateOf(activityId: string) {
  const s = state.signups.find((x) => x.activityId === activityId && (x.status === 0 || x.status === 1))
  if (!s) return 'none'
  return s.status === 1 ? 'joined' : 'pending'
}

function detailOf(a: MockActivity) {
  const sessions = (a.sessions ?? []).map((s) => {
    const d = new Date(s.startAt)
    return { ...s, weekText: WEEK[d.getDay()], monthText: MONTH[d.getMonth()], dateText: md(s.startAt), full: s.joinedCount >= s.capacity }
  })
  const full = a.joinedCount >= a.capacity
  const ended = new Date(a.endAt ?? a.startAt).getTime() < Date.now()
  const js = joinStateOf(a.id)
  return {
    id: a.id,
    title: a.title,
    coverUrl: a.coverUrl,
    tags: a.tags ?? [],
    refundPolicy: a.refundPolicy,
    priceCent: a.priceCent,
    priceText: a.priceCent === 0 ? '免费' : `¥${a.priceCent / 100}`,
    sessions,
    poiName: a.poiName,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    distanceText: null,
    joinedCount: a.joinedCount,
    capacity: a.capacity,
    joinedText: `${a.capacity}人一起`,
    highlights: a.highlights ?? [],
    host: { id: host.id, name: host.nickname, avatarUrl: host.avatarUrl, followed: false },
    joinState: js === 'joined' ? 'joined' : ended ? 'ended' : full ? 'full' : 'none',
    recommend: activities
      .filter((x) => x.cityId === a.cityId && x.id !== a.id && x.status === 1)
      .slice(0, 4)
      .map((x) => ({
        id: x.id,
        coverUrl: x.coverUrl,
        title: x.title,
        joinText: `${x.joinedCount}人已上车`,
        dateText: md(x.startAt),
        statusText: x.joinedCount >= x.capacity ? '已满' : '报名中',
      })),
  }
}

function issueTicket(a: { refId: string; title: string; coverUrl?: string; sessionAt?: string }) {
  const t = {
    id: newId('t_'),
    userId: demoUser.id,
    type: 1,
    refId: a.refId,
    title: a.title,
    coverUrl: a.coverUrl ?? null,
    sessionAt: a.sessionAt ?? null,
    status: 1,
    qrToken: newId('qr_'),
    sealText: '待发车',
  }
  state.tickets.unshift(t)
  return t
}

function ticketItem(t: any) {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    coverUrl: t.coverUrl,
    poiName: activities.find((a) => a.id === t.refId)?.poiName ?? null,
    sessionText: sessionText(t.sessionAt),
    status: t.status,
    statusText: ({ 0: '待发车', 1: '待验票', 2: '已验票', 3: '已过期', 4: '已退款' } as any)[t.status] ?? '未知',
    sealText: t.sealText,
    guaranteeText: '未保障',
    verify: t.status === 1,
  }
}

// ---------- 路由 ----------

type Ctx = { params: Record<string, string>; query: Record<string, string>; body: any }
type Result = { hit: false } | { hit: true; data?: any; error?: { code: number; message: string } }
type Handler = (ctx: Ctx) => any

const routes: { method: string; keys: string[]; re: RegExp; fn: Handler }[] = []

function route(method: string, path: string, fn: Handler) {
  const keys: string[] = []
  const re = new RegExp(
    '^' +
      path.replace(/\/:([a-zA-Z_]+)/g, (_m, k) => {
        keys.push(k)
        return '/([^/]+)'
      }) +
      '$',
  )
  routes.push({ method, keys, re, fn })
}

const fail = (code: number, message: string) => ({ __error: { code, message } })

// 基础
route('GET', '/app/config', () => ({
  version: appConfig.version,
  agreementVersion: appConfig.agreementVersion,
  signupSchema: appConfig.signupSchema,
  categories: categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, hot: c.isHot })),
  cities: cities.filter((c) => c.isHot).map((c) => ({ code: c.code, name: c.name, hot: true })),
}))

route('GET', '/app/cities', () => {
  const hot = cities.filter((c) => c.isHot).map((c) => ({ code: c.code, name: c.name }))
  const groupMap: Record<string, { code: string; name: string }[]> = {}
  cities.forEach((c) => {
    const list = groupMap[c.initial] ?? []
    list.push({ code: c.code, name: c.name })
    groupMap[c.initial] = list
  })
  return {
    located: hot[0] ?? null,
    hot,
    groups: Object.keys(groupMap)
      .sort()
      .map((initial) => ({ initial, cities: groupMap[initial] })),
  }
})

route('GET', '/app/agreement', (ctx) => ({
  type: ctx.query.type ?? 'user',
  version: '1',
  title: ctx.query.type === 'user' ? '用户协议' : '隐私政策',
  content:
    '<p>这是练手项目的占位协议文本，正式文本由运营在后台维护，接口返回富文本 HTML。</p>' +
    '<p>本项目不收集与业务无关的个人信息。</p>',
  updatedAt: '2026-10-18T00:00:00+08:00',
}))

route('POST', '/app/privacy-consent', (ctx) => {
  state.consentVersion = ctx.body?.docVersion
  save()
  return { recorded: true, agreedAt: new Date().toISOString(), docVersion: ctx.body?.docVersion, action: ctx.body?.action ?? 'agree' }
})

// 认证
route('POST', '/auth/login', () => ({
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
  isNew: false,
  user: demoUser,
}))
route('POST', '/auth/refresh', () => ({ token: 'mock-token', refreshToken: 'mock-refresh-token' }))

// 首页
route('GET', '/home/feed', (ctx) => {
  const cityCode = ctx.query.city
  const city = cityCode ? cities.find((c) => c.code === cityCode) : cities.find((c) => c.isHot)
  const limit = Math.min(Number(ctx.query.limit ?? 20), 50)
  const cat = ctx.query.categoryId
  const sort = ctx.query.sort

  let rows = activities.filter((a) => a.status === 1 && (!city || a.cityId === city.id))
  if (cat && cat !== 'cat_hot' && cat !== 'cat_all') {
    rows = rows.filter((a) => (a.categoryIds ?? []).indexOf(cat) >= 0)
  }
  rows = rows.slice().sort((a, b) => {
    const d = new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    return sort === 'latest' ? -d : d
  })

  const cursor = ctx.query.cursor
  if (cursor) {
    const [iso, id] = decodeURIComponent(cursor).split('|')
    const t = new Date(iso).getTime()
    rows = rows.filter((a) => new Date(a.startAt).getTime() > t || (new Date(a.startAt).getTime() === t && a.id > id))
  }

  const page = rows.slice(0, limit)
  const hasMore = rows.length > limit
  const last = page[page.length - 1]

  return {
    banners: appConfig.banners,
    categories: categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, selected: c.id === (cat ?? 'cat_hot') })),
    ad: appConfig.homeAd,
    guide: appConfig.homeGuide,
    list: page.map(toCard),
    nextCursor: hasMore && last ? `${last.startAt}|${last.id}` : null,
    hasMore,
  }
})

// 活动
route('GET', '/activities/:id', (ctx) => {
  const a = activities.find((x) => x.id === ctx.params.id)
  if (!a) return fail(3001, '活动不存在')
  return detailOf(a)
})

route('POST', '/activities/:id/signups', (ctx) => {
  const a = activities.find((x) => x.id === ctx.params.id)
  if (!a) return fail(3001, '活动不存在')

  const exist = state.signups.find((x) => x.activityId === a.id && (x.status === 0 || x.status === 1))
  if (exist) {
    if (exist.status === 1) return fail(3002, '你已报名该活动')
    const order = state.orders.find((o) => o.signupId === exist.id && o.status === 0)
    if (order) {
      return { signupId: exist.id, needPay: true, orderId: order.id, amountCent: order.amountCent, expireAt: order.expireAt }
    }
    return fail(3002, '你已报名该活动')
  }
  if (a.joinedCount >= a.capacity) return fail(3003, '名额已满')

  const sessionAt = ctx.body?.sessionAt || a.startAt
  const signup = {
    id: newId('s_'),
    activityId: a.id,
    sessionAt,
    nickname: ctx.body?.nickname ?? demoUser.nickname,
    gender: ctx.body?.gender ?? 0,
    avatarUrl: ctx.body?.avatarUrl,
    status: 0,
    orderId: undefined as string | undefined,
  }
  state.signups.push(signup)
  a.joinedCount += 1

  if (a.priceCent === 0) {
    signup.status = 1
    const ticket = issueTicket({ refId: a.id, title: a.title, coverUrl: a.coverUrl, sessionAt })
    save()
    return { signupId: signup.id, needPay: false, ticketId: ticket.id }
  }

  const order = {
    id: newId('o_'),
    orderNo: orderNo(),
    bizType: 1,
    bizId: a.id,
    signupId: signup.id,
    title: a.title,
    coverUrl: a.coverUrl,
    amountCent: a.priceCent,
    status: 0,
    expireAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
  state.orders.push(order)
  signup.orderId = order.id
  save()
  return { signupId: signup.id, needPay: true, orderId: order.id, amountCent: order.amountCent, expireAt: order.expireAt }
})

// 订单
route('POST', '/orders', (ctx) => {
  const bizType = Number(ctx.body?.bizType ?? 1)
  const bizId = ctx.body?.bizId
  const a = activities.find((x) => x.id === bizId)
  if (!a) return fail(3001, '活动不存在')
  if (a.priceCent <= 0) return fail(5002, '该内容无需支付')

  const exist = state.orders.find((o) => o.bizId === bizId && o.status === 0)
  if (exist && new Date(exist.expireAt).getTime() > Date.now()) {
    return { orderId: exist.id, orderNo: exist.orderNo, amountCent: exist.amountCent, expireAt: exist.expireAt, reused: true }
  }
  const order = {
    id: newId('o_'),
    orderNo: orderNo(),
    bizType,
    bizId,
    signupId: ctx.body?.signupId,
    title: a.title,
    coverUrl: a.coverUrl,
    amountCent: a.priceCent,
    status: 0,
    expireAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
  state.orders.push(order)
  save()
  return { orderId: order.id, orderNo: order.orderNo, amountCent: order.amountCent, expireAt: order.expireAt, reused: false }
})

route('GET', '/orders/:id', (ctx) => {
  const o = state.orders.find((x) => x.id === ctx.params.id)
  if (!o) return fail(5001, '订单不存在')
  if (o.status === 0 && new Date(o.expireAt).getTime() < Date.now()) o.status = 3

  const a = activities.find((x) => x.id === o.bizId)
  const signup = state.signups.find((s) => s.id === o.signupId)
  return {
    orderId: o.id,
    orderNo: o.orderNo,
    title: o.title,
    coverUrl: o.coverUrl,
    sessionText: signup ? mdh(signup.sessionAt) : '',
    poiName: a?.poiName ?? null,
    amountCent: o.amountCent,
    discountCent: 0,
    payableCent: o.amountCent,
    status: o.status,
    statusText: ['待支付', '已支付', '已取消', '已过期'][o.status] ?? '未知',
    payChannel: null,
    expireAt: o.expireAt,
    serverTime: new Date().toISOString(),
  }
})

route('POST', '/orders/:id/mock-pay', (ctx) => {
  const o = state.orders.find((x) => x.id === ctx.params.id)
  if (!o) return fail(5001, '订单不存在')
  if (o.status === 1) {
    const t = state.tickets.find((x) => x.refId === o.bizId)
    return { status: 1, paidAt: o.paidAt, ticketId: t?.id ?? null }
  }
  if (o.status !== 0) return fail(5003, '订单已过期或已取消')
  if (new Date(o.expireAt).getTime() < Date.now()) {
    o.status = 3
    save()
    return fail(5003, '订单已过期')
  }

  o.status = 1
  o.paidAt = new Date().toISOString()
  const signup = state.signups.find((s) => s.id === o.signupId)
  if (signup) signup.status = 1
  const ticket = issueTicket({
    refId: o.bizId,
    title: o.title,
    coverUrl: o.coverUrl,
    sessionAt: signup?.sessionAt,
  })
  save()
  return { status: 1, paidAt: o.paidAt, ticketId: ticket.id }
})

// 票
route('GET', '/tickets', (ctx) => {
  const type = Number(ctx.query.type ?? 0)
  const list = state.tickets.filter((t) => (type ? t.type === type : true))
  return { list: list.map(ticketItem), nextCursor: null, hasMore: false }
})

route('GET', '/tickets/:id', (ctx) => {
  const t = state.tickets.find((x) => x.id === ctx.params.id)
  if (!t) return fail(4001, '票不存在')
  const a = activities.find((x) => x.id === t.refId)
  return {
    id: t.id,
    title: t.title,
    coverUrl: t.coverUrl,
    poiName: a?.poiName ?? null,
    sessionText: sessionText(t.sessionAt),
    status: t.status,
    statusText: t.status === 1 ? '待验票' : '待发车',
    count: 1,
    qrToken: t.status === 1 ? t.qrToken : null,
    notice: [
      '请提前到达现场，找到工作人员',
      '出示此二维码，工作人员扫码完成验票',
      '扫码完成即确定使用，交易成功，费用会打入商家账户',
      '为避免造成财产损失，请勿将验票码截屏发给他人',
    ],
  }
})

// 挑战赛
route('GET', '/campaigns', (ctx) => {
  const city = cities.find((c) => c.code === ctx.query.city)
  const rows = campaigns.filter((c) => c.status === 1 && (!city || c.cityId === city.id))
  return {
    list: rows.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      sealUrl: c.sealUrl,
      dateText: `${md(c.startAt)} - ${md(c.endAt)}`,
      images: c.images,
      joinedCount: c.joinedCount,
      medalHint: c.medalHint,
      avatarStack: [],
      joined: false,
      actionText: '打卡',
    })),
    nextCursor: null,
    hasMore: false,
  }
})

route('GET', '/campaigns/:id', (ctx) => {
  const c = campaigns.find((x) => x.id === ctx.params.id)
  if (!c) return fail(6001, '挑战赛不存在')
  const cps = checkpoints.filter((x) => x.campaignId === c.id)
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    bannerUrl: c.bannerUrl,
    regionName: c.regionName,
    description: c.description,
    priceCent: c.priceCent,
    priceText: c.priceCent === 0 ? '¥0起' : `¥${c.priceCent / 100}起`,
    tabs: ['challenge', 'rank'],
    rewards: [{ name: '限定奖牌', imageUrl: c.sealUrl, condition: `打卡全部 ${cps.length} 个点位` }],
    checkpointCount: cps.length,
    joined: false,
    myProgress: { done: 0, total: cps.length, finished: false },
    actionText: `参加「${c.subtitle ?? c.title}」打卡挑战`,
  }
})

route('GET', '/campaigns/:id/checkpoints', (ctx) =>
  checkpoints
    .filter((x) => x.campaignId === ctx.params.id)
    .map((x) => ({
      id: x.id,
      seq: x.seq,
      name: x.name,
      coverUrl: x.coverUrl,
      intro: x.intro,
      poiName: x.poiName,
      distanceText: null,
      checked: false,
    })),
)

// ---------- 入口 ----------

export async function mockCall(o: { url: string; method?: string; data?: any }): Promise<Result> {
  const method = (o.method ?? 'GET').toUpperCase()
  const [rawPath, rawQuery] = o.url.split('?')
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const query: Record<string, string> = {}
  if (rawQuery) {
    rawQuery.split('&').forEach((kv) => {
      const [k, v = ''] = kv.split('=')
      query[k] = decodeURIComponent(v)
    })
  }

  for (const r of routes) {
    if (r.method !== method) continue
    const m = r.re.exec(path)
    if (!m) continue
    const params: Record<string, string> = {}
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))

    await delay(80 + Math.floor(Math.random() * 120))
    const out = r.fn({ params, query, body: o.data })
    if (out && out.__error) return { hit: true, error: out.__error }
    return { hit: true, data: out }
  }

  return { hit: false }
}
