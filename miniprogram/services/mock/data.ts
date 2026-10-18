/**
 * Mock 数据集：与 backend/prisma/seed.ts 同构（字段名、枚举值保持一致），
 * 仅在 env.mock 打开时被 services/mock 使用，不参与真实请求。
 * 时间全部相对“今天”生成，保证活动未过期、报名/支付链路可反复演示。
 */

const HOUR = 3600 * 1000

/** 相对今天的第 dayOffset 天、hour 点（本地时区） */
function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return new Date(d.getTime() + dayOffset * 24 * HOUR).toISOString()
}

export const img = (seed: string, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`

export const cities = [
  { id: 'c_sz', code: 'shenzhen', name: '深圳市', province: '广东省', initial: 'S', isHot: true, sort: 1, status: 1 },
  { id: 'c_sh', code: 'shanghai', name: '上海市', province: '上海市', initial: 'S', isHot: true, sort: 2, status: 1 },
  { id: 'c_bj', code: 'beijing', name: '北京市', province: '北京市', initial: 'B', isHot: true, sort: 3, status: 1 },
  { id: 'c_ay', code: 'anyang', name: '安阳市', province: '河南省', initial: 'A', isHot: false, sort: 4, status: 1 },
  { id: 'c_gz', code: 'guangzhou', name: '广州市', province: '广东省', initial: 'G', isHot: true, sort: 5, status: 1 },
  { id: 'c_hz', code: 'hangzhou', name: '杭州市', province: '浙江省', initial: 'H', isHot: false, sort: 6, status: 1 },
]

export const categories = [
  { id: 'cat_hot', name: '热门', emoji: '🔥', isHot: true, sort: 1, status: 1 },
  { id: 'cat_all', name: '全部', emoji: '', isHot: false, sort: 2, status: 1 },
  { id: 'cat_run', name: '跑步', emoji: '🏃', isHot: false, sort: 3, status: 1 },
  { id: 'cat_frisbee', name: '飞盘', emoji: '🥏', isHot: false, sort: 4, status: 1 },
  { id: 'cat_hide', name: '躲猫猫', emoji: '🙈', isHot: false, sort: 5, status: 1 },
  { id: 'cat_dance', name: '舞蹈', emoji: '💃', isHot: false, sort: 6, status: 1 },
  { id: 'cat_tennis', name: '网球', emoji: '🎾', isHot: false, sort: 7, status: 1 },
  { id: 'cat_self', name: '自我探索', emoji: '🧭', isHot: false, sort: 8, status: 1 },
  { id: 'cat_chill', name: '吃喝松弛', emoji: '☕', isHot: false, sort: 9, status: 1 },
]

export const host = {
  id: 'u_host',
  nickname: '凡心向上·游戏疗愈夜',
  avatarUrl: img('avatar-host', 200, 200),
}

export const demoUser = {
  id: 'u_demo',
  nickname: '演示用户',
  avatarUrl: img('avatar-demo', 200, 200),
  gender: 1,
  mbti: 'INTJ',
  about: '喜欢徒步和桌游',
}

export interface MockActivity {
  id: string
  title: string
  coverUrl: string
  cityId: string
  poiName: string
  address: string
  lat: number
  lng: number
  startAt: string
  endAt: string
  sessions: { date: string; startAt: string; endAt: string; capacity: number; joinedCount: number }[]
  priceCent: number
  capacity: number
  joinedCount: number
  tags: string[]
  refundPolicy: string
  highlights: { icon: string; title: string; content: string }[]
  categoryIds: string[]
  status: number
}

export const activities: MockActivity[] = [
  {
    id: 'a_1001',
    title: '匹克球热身畅打4h｜全天新手友好',
    coverUrl: img('pickleball'),
    cityId: 'c_sz',
    poiName: '匹克球体育中心(匹克球)',
    address: '南山区科技园南区科苑路 15 号',
    lat: 22.54,
    lng: 113.95,
    startAt: at(0, 18),
    endAt: at(0, 22),
    sessions: [
      { date: at(0, 18).slice(0, 10), startAt: at(0, 18), endAt: at(0, 22), capacity: 20, joinedCount: 12 },
      { date: at(1, 18).slice(0, 10), startAt: at(1, 18), endAt: at(1, 22), capacity: 20, joinedCount: 5 },
    ],
    priceCent: 0,
    capacity: 20,
    joinedCount: 12,
    tags: ['匹克球', '新手友好'],
    refundPolicy: '活动开始前可随时全额退款',
    highlights: [
      { icon: '🎲', title: '趣味热身', content: '四小时畅打，含基础教学与分组对抗' },
      { icon: '✨', title: '新手友好', content: '提供球拍与球，零基础也能玩' },
    ],
    categoryIds: ['cat_hot', 'cat_tennis'],
    status: 1,
  },
  {
    id: 'a_1002',
    title: '已有10人-疗愈游戏局：用游戏思维拥抱生活',
    coverUrl: img('healing'),
    cityId: 'c_sz',
    poiName: '深圳万象天地',
    address: '南山区深南大道 9668 号',
    lat: 22.54,
    lng: 113.95,
    startAt: at(0, 19, 30),
    endAt: at(0, 21, 15),
    sessions: [],
    priceCent: 19900,
    capacity: 20,
    joinedCount: 10,
    tags: ['沙龙', '游戏疗愈'],
    refundPolicy: '活动开始前可随时全额退款，超过不支持退款',
    highlights: [
      { icon: '💗', title: '用好玩的游戏消除烦恼', content: '深度链接有趣灵魂' },
      { icon: '🎲', title: '趣味游戏，疗愈心灵', content: '五种疗愈魔法道具，开启别开生面的疗愈之旅' },
      { icon: '🌱', title: '深度探索，自我成长', content: '每场包含至少 10 轮自我探索、5 次温暖解疑' },
    ],
    categoryIds: ['cat_hot', 'cat_self'],
    status: 1,
  },
  {
    id: 'a_1003',
    title: '城市夜跑 · 沿江 10km 轻松配速',
    coverUrl: img('running'),
    cityId: 'c_sz',
    poiName: '深圳湾公园',
    address: '南山区滨海大道',
    lat: 22.51,
    lng: 113.94,
    startAt: at(1, 20),
    endAt: at(1, 22),
    sessions: [],
    priceCent: 0,
    capacity: 30,
    joinedCount: 8,
    tags: ['跑步'],
    refundPolicy: '免费活动，随时可退出',
    highlights: [{ icon: '🏃', title: '轻松配速', content: '6 分半配速，适合新手' }],
    categoryIds: ['cat_run'],
    status: 1,
  },
  {
    id: 'a_1004',
    title: '周日飞盘新手专场 · 教练带练 2h',
    coverUrl: img('frisbee'),
    cityId: 'c_sz',
    poiName: '莲花山公园风筝广场',
    address: '福田区红荔路 6030 号',
    lat: 22.55,
    lng: 114.05,
    startAt: at(2, 16),
    endAt: at(2, 18),
    sessions: [],
    priceCent: 5900,
    capacity: 24,
    joinedCount: 18,
    tags: ['飞盘', '新手友好'],
    refundPolicy: '活动开始前 24 小时可退',
    highlights: [
      { icon: '🥏', title: '零基础教学', content: '正反手传盘 + 跑位配合' },
      { icon: '👥', title: '分组对抗', content: '按水平随机分组，保证每个人都能上手' },
    ],
    categoryIds: ['cat_hot', 'cat_frisbee'],
    status: 1,
  },
  {
    id: 'a_1005',
    title: '周五桌游夜：轻策略局，输的人请奶茶',
    coverUrl: img('boardgame'),
    cityId: 'c_sz',
    poiName: '南山书城 3F 桌游馆',
    address: '南山区南海大道 2748 号',
    lat: 22.53,
    lng: 113.93,
    startAt: at(3, 19),
    endAt: at(3, 22),
    sessions: [],
    priceCent: 0,
    capacity: 12,
    joinedCount: 9,
    tags: ['桌游', '轻社交'],
    refundPolicy: '免费活动，随时可退出',
    highlights: [{ icon: '🎲', title: '规则讲解', content: '现场有主持带教，不用提前预习' }],
    categoryIds: ['cat_hot', 'cat_self'],
    status: 1,
  },
  {
    id: 'a_1006',
    title: '城市躲猫猫 · 40 人大型局（含夜场）',
    coverUrl: img('hide'),
    cityId: 'c_sz',
    poiName: '深圳人才公园',
    address: '南山区科苑南路 2888 号',
    lat: 22.52,
    lng: 113.94,
    startAt: at(4, 19, 30),
    endAt: at(4, 22),
    sessions: [],
    priceCent: 8800,
    capacity: 40,
    joinedCount: 1,
    tags: ['躲猫猫', '大型局'],
    refundPolicy: '活动开始前 12 小时可退',
    highlights: [
      { icon: '🙈', title: '分组抓人', content: '按颜色手环分组，跑动范围 800m' },
      { icon: '🌙', title: '夜场氛围', content: '荧光手环 + 现场摄影' },
    ],
    categoryIds: ['cat_hide'],
    status: 1,
  },
  {
    id: 'a_1007',
    title: '周六清晨瑜伽 · 海边草地 60 分钟',
    coverUrl: img('yoga'),
    cityId: 'c_sz',
    poiName: '深圳湾运动公园草坪',
    address: '南山区东滨路',
    lat: 22.5,
    lng: 113.93,
    startAt: at(5, 7, 30),
    endAt: at(5, 9),
    sessions: [],
    priceCent: 3900,
    capacity: 16,
    joinedCount: 16,
    tags: ['瑜伽', '晨间'],
    refundPolicy: '活动开始前 24 小时可退',
    highlights: [{ icon: '🧘', title: '自带垫子', content: '现场提供少量公用垫，建议自带' }],
    categoryIds: ['cat_chill'],
    status: 1,
  },
]

export const campaigns = [
  {
    id: 'cp_1',
    title: '「入戏长安」城市探索打卡挑战赛',
    subtitle: '入戏长安',
    sealUrl: img('seal', 200, 200),
    bannerUrl: img('campaign-banner', 800, 600),
    regionName: '西安·新城区',
    cityId: 'c_sz',
    description:
      '从秦腔戏台到城墙烟火，串联永兴坊、东岳庙、皇城坊、民乐园等核心点位，用一天时间把长安走成一出戏。',
    images: [img('c1', 400, 400), img('c2', 400, 400), img('c3', 400, 400)],
    startAt: at(-60, 0),
    endAt: at(74, 23),
    priceCent: 0,
    joinedCount: 714,
    medalHint: '714人打卡得限定奖牌',
    status: 1,
  },
  {
    id: 'cp_2',
    title: '「公益向山」九寨沟环保路线打卡',
    subtitle: '公益向山',
    sealUrl: img('seal2', 200, 200),
    bannerUrl: img('campaign-banner2', 800, 600),
    regionName: '九寨沟',
    cityId: 'c_sz',
    description: '沿生态步道清理垃圾并完成 5 个点位打卡，集齐后可兑换公益奖牌。',
    images: [img('c4', 400, 400), img('c5', 400, 400)],
    startAt: at(-170, 0),
    endAt: at(74, 23),
    priceCent: 0,
    joinedCount: 286,
    medalHint: '286人打卡得公益奖牌',
    status: 1,
  },
]

export const checkpoints = [
  { id: 'ck_1', campaignId: 'cp_1', seq: 1, name: '游客中心', poiName: '游客中心售票处', coverUrl: img('cp1', 300, 300), intro: '游客集合地点，由此可乘车前往灵山幻境景点。' },
  { id: 'ck_2', campaignId: 'cp_1', seq: 2, name: '永兴坊', poiName: '永兴坊牌楼', coverUrl: img('cp2', 300, 300), intro: '非遗美食街区，打卡点位在牌楼下方。' },
  { id: 'ck_3', campaignId: 'cp_1', seq: 3, name: '城墙南门', poiName: '永宁门', coverUrl: img('cp3', 300, 300), intro: '上城墙后向南 50 米，注意营业时间。' },
  { id: 'ck_4', campaignId: 'cp_2', seq: 1, name: '树正群海', poiName: '树正寨入口', coverUrl: img('cp4', 300, 300), intro: '沿栈道打卡，注意不要下到水边。' },
  { id: 'ck_5', campaignId: 'cp_2', seq: 2, name: '诺日朗瀑布', poiName: '观景台', coverUrl: img('cp5', 300, 300), intro: '人流较多，建议错峰打卡。' },
]

export const appConfig = {
  version: 'v1.0.0',
  agreementVersion: '1',
  signupSchema: { fields: ['avatar', 'nickname', 'gender'] },
  banners: [
    { id: 'b1', slot: 'banner_l1', title: '城市会玩', subtitle: 'DAILY 30', imageUrl: img('banner1', 800, 900), jumpType: 'activity', jumpUrl: 'a_1001' },
    { id: 'b2', slot: 'banner_l2', title: '主理人宇宙', subtitle: 'VOL.06', imageUrl: img('banner2', 400, 900), jumpType: 'activity', jumpUrl: 'a_1002' },
  ],
  homeAd: { brand: '品牌联名', title: '秋季影像企划', imageUrl: img('ad', 1000, 400), jumpUrl: '', ctaText: '点击查看' },
  homeGuide: { text: '聊点有意思的 顺便认识有趣的人', illustration: null },
}

export const initialTickets = [
  {
    id: 't_1',
    userId: 'u_demo',
    type: 1,
    refId: 'a_1002',
    title: '已有10人-疗愈游戏局：用游戏思维拥抱生活',
    coverUrl: img('healing'),
    sessionAt: at(0, 19, 30),
    status: 1,
    qrToken: 'qr_demo_token_1',
    sealText: '待发车',
  },
]
