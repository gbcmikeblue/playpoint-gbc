/**
 * M0 种子数据：2 城市 / 9 分类 / 1 用户 / 2 活动 / 1 挑战赛 + 3 打卡点 / 1 票 / app_config
 * 全部使用 upsert，可重复执行：npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const img = (seed: string, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`

async function main() {
  // 城市
  const cities = [
    { id: 'c_sz', code: 'shenzhen', name: '深圳市', province: '广东省', initial: 'S', isHot: true, sort: 1 },
    { id: 'c_sh', code: 'shanghai', name: '上海市', province: '上海市', initial: 'S', isHot: true, sort: 2 },
    { id: 'c_bj', code: 'beijing', name: '北京市', province: '北京市', initial: 'B', isHot: true, sort: 3 },
    { id: 'c_ay', code: 'anyang', name: '安阳市', province: '河南省', initial: 'A', isHot: false, sort: 0 },
  ]
  for (const c of cities) {
    await prisma.city.upsert({ where: { id: c.id }, update: c, create: c })
  }

  // 分类
  const categories = [
    { id: 'cat_hot', name: '热门', emoji: '🔥', isHot: true, sort: 1 },
    { id: 'cat_all', name: '全部', emoji: '', isHot: false, sort: 2 },
    { id: 'cat_run', name: '跑步', emoji: '🏃', isHot: false, sort: 3 },
    { id: 'cat_frisbee', name: '飞盘', emoji: '🥏', isHot: false, sort: 4 },
    { id: 'cat_hide', name: '躲猫猫', emoji: '🙈', isHot: false, sort: 5 },
    { id: 'cat_dance', name: '舞蹈', emoji: '💃', isHot: false, sort: 6 },
    { id: 'cat_tennis', name: '网球', emoji: '🎾', isHot: false, sort: 7 },
    { id: 'cat_self', name: '自我探索', emoji: '🧭', isHot: false, sort: 8 },
    { id: 'cat_chill', name: '吃喝松弛', emoji: '☕', isHot: false, sort: 9 },
  ]
  for (const c of categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c })
  }

  // 演示用户 + 主理人
  await prisma.user.upsert({
    where: { id: 'u_demo' },
    update: {},
    create: {
      id: 'u_demo',
      openid: 'mock_dev',
      nickname: '演示用户',
      avatarUrl: img('avatar-demo', 200, 200),
      gender: 1,
      mbti: 'INTJ',
      about: '喜欢徒步和桌游',
      tags: undefined,
    } as any,
  })
  await prisma.user.upsert({
    where: { id: 'u_host' },
    update: {},
    create: {
      id: 'u_host',
      openid: 'mock_host',
      nickname: '凡心向上·游戏疗愈夜',
      avatarUrl: img('avatar-host', 200, 200),
      role: 1,
    },
  })

  // 活动
  const activities = [
    {
      id: 'a_1001',
      title: '10.18周日匹克球热身畅打4h｜全天',
      coverUrl: img('pickleball'),
      cityId: 'c_sz',
      poiName: '匹克球体育中心(匹克球)',
      address: '浦东新区世纪大道1号',
      lat: 31.2304,
      lng: 121.4737,
      startAt: new Date('2026-10-18T18:00:00+08:00'),
      endAt: new Date('2026-10-18T22:00:00+08:00'),
      sessions: [
        { date: '2026-10-18', startAt: '2026-10-18T18:00:00+08:00', endAt: '2026-10-18T22:00:00+08:00', capacity: 20, joinedCount: 12 },
        { date: '2026-10-19', startAt: '2026-10-19T18:00:00+08:00', endAt: '2026-10-19T22:00:00+08:00', capacity: 20, joinedCount: 5 },
      ],
      priceCent: 0,
      capacity: 20,
      joinedCount: 12,
      tags: ['匹克球'],
      refundPolicy: '活动开始前可随时全额退款',
      highlights: [
        { icon: '🎲', title: '趣味热身', content: '四小时畅打，含基础教学与分组对抗' },
        { icon: '✨', title: '新手友好', content: '提供球拍与球，零基础也能玩' },
      ],
      categoryIds: ['cat_hot', 'cat_tennis'],
      hostId: 'u_host',
      status: 1,
    },
    {
      id: 'a_1002',
      title: '已有10人-疗愈游戏局：用游戏思维拥抱生活',
      coverUrl: img('healing'),
      cityId: 'c_sz',
      poiName: '深圳万象天地',
      address: '南山区深南大道9668号',
      lat: 22.54,
      lng: 113.95,
      startAt: new Date('2026-10-18T19:30:00+08:00'),
      endAt: new Date('2026-10-18T21:15:00+08:00'),
      sessions: [],
      priceCent: 19900,
      capacity: 20,
      joinedCount: 10,
      tags: ['沙龙', '免费游戏疗愈'],
      refundPolicy: '活动开始前可随时全额退款，超过不支持退款',
      highlights: [
        { icon: '💗', title: '用好玩的游戏帮你消除烦恼', content: '深度链接有趣灵魂' },
        { icon: '🎲', title: '趣味游戏，疗愈心灵', content: '五种疗愈魔法道具，开启别开生面的疗愈之旅' },
        { icon: '🌱', title: '深度探索，自我成长', content: '每场包含至少10轮自我探索、5次温暖解疑' },
      ],
      categoryIds: ['cat_hot', 'cat_self'],
      hostId: 'u_host',
      status: 1,
    },
    {
      id: 'a_1003',
      title: '城市夜跑 · 沿江10km轻松配速',
      coverUrl: img('running'),
      cityId: 'c_sz',
      poiName: '深圳湾公园',
      address: '南山区滨海大道',
      lat: 22.51,
      lng: 113.94,
      startAt: new Date('2026-10-19T20:00:00+08:00'),
      sessions: [],
      priceCent: 0,
      capacity: 30,
      joinedCount: 8,
      tags: ['跑步'],
      refundPolicy: '免费活动，随时可退出',
      highlights: [{ icon: '🏃', title: '轻松配速', content: '6分半配速，适合新手' }],
      categoryIds: ['cat_run'],
      hostId: 'u_host',
      status: 1,
    },
  ]
  for (const a of activities) {
    await prisma.activity.upsert({ where: { id: a.id }, update: a as any, create: a as any })
  }

  // 挑战赛 + 打卡点
  await prisma.campaign.upsert({
    where: { id: 'cp_1' },
    update: {},
    create: {
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
      startAt: new Date('2026-08-18T00:00:00+08:00'),
      endAt: new Date('2026-12-31T23:59:59+08:00'),
      priceCent: 0,
      joinedCount: 714,
      medalHint: '714人打卡得限定奖牌',
      status: 1,
    },
  })

  const checkpoints = [
    { id: 'ck_1', campaignId: 'cp_1', seq: 1, name: '游客中心', poiName: '游客中心售票处', lat: 34.265, lng: 108.954, radiusM: 300, coverUrl: img('cp1', 300, 300), intro: '游客集合地点，由此可乘车前往灵山幻境景点。' },
    { id: 'ck_2', campaignId: 'cp_1', seq: 2, name: '永兴坊', poiName: '永兴坊牌楼', lat: 34.266, lng: 108.96, radiusM: 300, coverUrl: img('cp2', 300, 300), intro: '非遗美食街区，打卡点位在牌楼下方。' },
    { id: 'ck_3', campaignId: 'cp_1', seq: 3, name: '城墙南门', poiName: '永宁门', lat: 34.254, lng: 108.947, radiusM: 500, coverUrl: img('cp3', 300, 300), intro: '上城墙后向南 50 米，注意营业时间。' },
  ]
  for (const c of checkpoints) {
    await prisma.campaignCheckpoint.upsert({ where: { id: c.id }, update: c, create: c })
  }

  // 票
  await prisma.ticket.upsert({
    where: { id: 't_1' },
    update: {},
    create: {
      id: 't_1',
      userId: 'u_demo',
      type: 1,
      refId: 'a_1002',
      title: '已有10人-疗愈游戏局：用游戏思维拥抱生活',
      coverUrl: img('healing'),
      sessionAt: new Date('2026-10-18T19:30:00+08:00'),
      status: 1,
      qrToken: 'qr_demo_token_1',
      sealText: '待发车',
      notice: [
        '请提前到达现场，找到工作人员',
        '出示此二维码，工作人员扫码完成验票',
        '扫码完成即确定使用，交易成功，费用会打入商家账户',
        '为避免造成财产损失，请勿将验票码截屏发给他人',
      ],
      poiName: undefined,
    } as any,
  })

  // 应用配置
  const configs = [
    { key: 'version', value: 'v1.0.0' },
    { key: 'agreementVersion', value: '1' },
    { key: 'signupSchema', value: { fields: ['avatar', 'nickname', 'gender'] } },
    {
      key: 'banners',
      value: [
        {
          id: 'b1',
          slot: 'banner_l1',
          title: '城市会玩',
          subtitle: 'DAILY 30',
          imageUrl: img('banner1', 800, 900),
          jumpType: 'activity',
          jumpUrl: 'a_1001',
        },
        {
          id: 'b2',
          slot: 'banner_l2',
          title: '主理人宇宙',
          subtitle: 'VOL.06',
          imageUrl: img('banner2', 400, 900),
          jumpType: 'activity',
          jumpUrl: 'a_1002',
        },
      ],
    },
    {
      key: 'homeAd',
      value: {
        brand: '品牌联名',
        title: '秋季影像企划',
        imageUrl: img('ad', 1000, 400),
        jumpUrl: '',
        ctaText: '点击查看',
      },
    },
    {
      key: 'homeGuide',
      value: { text: '聊点有意思的 顺便认识有趣的人', illustration: null },
    },
  ]
  for (const c of configs) {
    await prisma.appConfig.upsert({
      where: { key: c.key },
      update: { value: c.value as any },
      create: { key: c.key, value: c.value as any },
    })
  }

  const counts = {
    cities: await prisma.city.count(),
    categories: await prisma.category.count(),
    activities: await prisma.activity.count(),
    campaigns: await prisma.campaign.count(),
    checkpoints: await prisma.campaignCheckpoint.count(),
    tickets: await prisma.ticket.count(),
    configs: await prisma.appConfig.count(),
  }
  console.log('seed done:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
