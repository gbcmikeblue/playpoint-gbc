import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { PrismaService } from '../prisma/prisma.service'
import { BizException, ERR } from '../common/biz.exception'

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async list(cityCode?: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 50)
    const city = cityCode ? await this.prisma.city.findUnique({ where: { code: cityCode } }) : null

    const rows = await this.prisma.campaign.findMany({
      where: { status: 1, ...(city ? { cityId: city.id } : {}) },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasMore = rows.length > take
    const list = rows.slice(0, take)

    return {
      list: list.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        sealUrl: c.sealUrl,
        dateText: `${dayjs(c.startAt).format('MM.DD')} - ${dayjs(c.endAt).format('MM.DD')}`,
        images: (c.images as string[]) ?? [],
        joinedCount: c.joinedCount,
        medalHint: c.medalHint,
        avatarStack: [],
        joined: false,
        actionText: '打卡',
      })),
      nextCursor: hasMore ? list[list.length - 1].id : null,
      hasMore,
    }
  }

  async detail(id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: { checkpoints: { where: { status: 1 }, orderBy: { seq: 'asc' } } },
    })
    if (!c) throw new BizException(ERR.NOT_FOUND, '挑战赛不存在')

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
      rewards: [
        { name: '限定奖牌', imageUrl: c.sealUrl, condition: `打卡全部 ${c.checkpoints.length} 个点位` },
      ],
      checkpointCount: c.checkpoints.length,
      joined: false,
      myProgress: { done: 0, total: c.checkpoints.length, finished: false },
      actionText: `参加「${c.subtitle ?? c.title}」打卡挑战`,
    }
  }

  async checkpoints(id: string) {
    const rows = await this.prisma.campaignCheckpoint.findMany({
      where: { campaignId: id, status: 1 },
      orderBy: { seq: 'asc' },
    })
    return rows.map((r) => ({
      id: r.id,
      seq: r.seq,
      name: r.name,
      coverUrl: r.coverUrl,
      intro: r.intro,
      poiName: r.poiName,
      distanceText: null,
      checked: false,
    }))
  }
}
