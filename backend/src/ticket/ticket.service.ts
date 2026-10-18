import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { PrismaService } from '../prisma/prisma.service'
import { BizException, ERR } from '../common/biz.exception'
import { newId, newQrToken } from '../common/id'

const DEFAULT_NOTICE = [
  '请提前到达现场，找到工作人员',
  '出示此二维码，工作人员扫码完成验票',
  '扫码完成即确定使用，交易成功，费用会打入商家账户',
  '为避免造成财产损失，请勿将验票码截屏发给他人',
]

const STATUS_TEXT: Record<number, string> = {
  0: '待发车',
  1: '待验票',
  2: '已验票',
  3: '已过期',
  4: '已退款',
}

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  /** 出票（0 元报名与支付成功共用） */
  async issue(params: {
    userId: string
    type: number
    refId: string
    title: string
    coverUrl?: string | null
    sessionAt?: Date | null
  }) {
    return this.prisma.ticket.create({
      data: {
        id: newId('t_'),
        userId: params.userId,
        type: params.type,
        refId: params.refId,
        title: params.title,
        coverUrl: params.coverUrl ?? null,
        sessionAt: params.sessionAt ?? null,
        validFrom: params.sessionAt ? dayjs(params.sessionAt).subtract(2, 'hour').toDate() : null,
        validTo: params.sessionAt ? dayjs(params.sessionAt).add(6, 'hour').toDate() : null,
        status: 1,
        qrToken: newQrToken(),
        sealText: '待发车',
        notice: DEFAULT_NOTICE,
      },
    })
  }

  async list(userId: string, type?: number, cursor?: string, limit = 20) {
    const take = Math.min(limit, 50)
    const rows = await this.prisma.ticket.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasMore = rows.length > take
    const list = rows.slice(0, take)

    return {
      list: list.map((t) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        coverUrl: t.coverUrl,
        poiName: null,
        sessionText: this.sessionText(t.sessionAt),
        status: t.status,
        statusText: STATUS_TEXT[t.status] ?? '未知',
        sealText: t.sealText,
        guaranteeText: '未保障',
        verify: t.status === 1,
      })),
      nextCursor: hasMore ? list[list.length - 1].id : null,
      hasMore,
    }
  }

  async detail(id: string, userId: string) {
    const t = await this.prisma.ticket.findUnique({ where: { id } })
    if (!t || t.userId !== userId) throw new BizException(ERR.NOT_FOUND, '票不存在')

    const activity = t.type === 1 ? await this.prisma.activity.findUnique({ where: { id: t.refId } }) : null

    return {
      id: t.id,
      title: t.title,
      coverUrl: t.coverUrl,
      poiName: activity?.poiName ?? null,
      sessionText: this.sessionText(t.sessionAt),
      status: t.status,
      statusText: t.status === 1 ? '待验票' : STATUS_TEXT[t.status],
      count: 1,
      qrToken: t.status === 1 ? t.qrToken : null,
      notice: t.notice as string[],
    }
  }

  private sessionText(at?: Date | null) {
    if (!at) return ''
    const d = dayjs(at)
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()]
    return `${week}${d.format('MM.DD HH:mm')}`
  }
}
