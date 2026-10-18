import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { PrismaService } from '../prisma/prisma.service'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(params: { city?: string; categoryId?: string; sort?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 20, 50)

    const city = params.city
      ? await this.prisma.city.findUnique({ where: { code: params.city } })
      : await this.prisma.city.findFirst({ where: { isHot: true }, orderBy: { sort: 'asc' } })

    const [configRows, categories] = await Promise.all([
      this.prisma.appConfig.findMany(),
      this.prisma.category.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
    ])
    const cfg: Record<string, any> = {}
    for (const r of configRows) cfg[r.key] = r.value

    const where: any = {
      status: 1,
      deletedAt: null,
      ...(city ? { cityId: city.id } : {}),
    }
    const cat = params.categoryId
    if (cat && cat !== 'cat_all' && cat !== 'cat_hot') {
      where.categoryIds = { array_contains: cat }
    }

    const orderBy: any[] =
      params.sort === 'latest' ? [{ startAt: 'desc' }, { id: 'desc' }] : [{ startAt: 'asc' }, { id: 'asc' }]

    const cursorCond = params.cursor ? this.decodeCursor(params.cursor) : null
    const rows = await this.prisma.activity.findMany({
      where: cursorCond
        ? {
            AND: [
              where,
              {
                OR: [
                  { startAt: { gt: cursorCond.startAt } },
                  { startAt: cursorCond.startAt, id: { gt: cursorCond.id } },
                ],
              },
            ],
          }
        : where,
      orderBy,
      take: limit + 1,
    })

    const hasMore = rows.length > limit
    const list = rows.slice(0, limit)
    const last = list[list.length - 1]

    return {
      banners: cfg.banners ?? [],
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        selected: c.id === (cat ?? 'cat_hot'),
      })),
      ad: cfg.homeAd ?? null,
      guide: cfg.homeGuide ?? { text: '聊点有意思的 顺便认识有趣的人', illustration: null },
      list: list.map((a) => this.toCard(a)),
      nextCursor: hasMore && last ? this.encodeCursor(last.startAt, last.id) : null,
      hasMore,
    }
  }

  private toCard(a: any) {
    const start = dayjs(a.startAt)
    const isToday = start.isSame(dayjs(), 'day')
    const tags = (a.tags as string[]) ?? []
    return {
      id: a.id,
      type: 'activity',
      coverUrl: a.coverUrl,
      title: a.title,
      startAt: start.toISOString(),
      dateText: start.format('MM/DD'),
      isToday,
      timeText: start.format('HH:mm'),
      weekText: WEEK[start.day()],
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

  private encodeCursor(startAt: Date, id: string) {
    return Buffer.from(`${startAt.toISOString()}|${id}`).toString('base64')
  }

  private decodeCursor(cursor: string) {
    try {
      const [iso, id] = Buffer.from(cursor, 'base64').toString('utf8').split('|')
      return { startAt: new Date(iso), id }
    } catch {
      return null
    }
  }
}
