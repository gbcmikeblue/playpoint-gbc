import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AppInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    const rows = await this.prisma.appConfig.findMany()
    const map: Record<string, any> = {}
    for (const r of rows) map[r.key] = r.value

    const [categories, cities] = await Promise.all([
      this.prisma.category.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      this.prisma.city.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
    ])

    return {
      version: map.version ?? 'v1.0.0',
      agreementVersion: map.agreementVersion ?? '1',
      signupSchema: map.signupSchema ?? { fields: ['avatar', 'nickname', 'gender'] },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        hot: c.isHot,
      })),
      cities: cities
        .filter((c) => c.isHot)
        .map((c) => ({ code: c.code, name: c.name, hot: true })),
    }
  }

  async getCities() {
    const cities = await this.prisma.city.findMany({ where: { status: 1 }, orderBy: [{ initial: 'asc' }, { sort: 'asc' }] })

    const hot = cities.filter((c) => c.isHot).map((c) => ({ code: c.code, name: c.name }))
    const groupMap = new Map<string, { code: string; name: string }[]>()
    for (const c of cities) {
      const list = groupMap.get(c.initial) ?? []
      list.push({ code: c.code, name: c.name })
      groupMap.set(c.initial, list)
    }

    return {
      located: hot[0] ?? null,
      hot,
      groups: [...groupMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([initial, list]) => ({ initial, cities: list })),
    }
  }

  async recordConsent(userId: string, docVersion: string, action: 'agree' | 'disagree') {
    if (action === 'agree') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { privacyAgreedAt: new Date() },
      })
    }
    return { recorded: true, agreedAt: new Date().toISOString(), docVersion, action }
  }

  getAgreement(type: string) {
    const isUser = type === 'user'
    return {
      type,
      version: '1',
      title: isUser ? '用户协议' : '隐私政策',
      content:
        '<p>这是 M0 阶段的占位协议文本。正式文本由运营在后台维护，接口返回富文本 HTML。</p>' +
        '<p>本项目为练手项目，不收集与业务无关的个人信息。</p>',
      updatedAt: '2026-10-18T00:00:00+08:00',
    }
  }
}
