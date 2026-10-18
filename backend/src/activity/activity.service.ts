import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { PrismaService } from '../prisma/prisma.service'
import { BizException, ERR } from '../common/biz.exception'
import { newId, newOrderNo } from '../common/id'
import { TicketService } from '../ticket/ticket.service'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export interface SignupDto {
  sessionAt?: string
  nickname: string
  gender: number
  avatarUrl?: string
  extra?: Record<string, any>
}

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketService,
  ) {}

  async detail(id: string, userId?: string) {
    const a = await this.prisma.activity.findUnique({ where: { id }, include: { city: true } })
    if (!a || a.deletedAt) throw new BizException(ERR.NOT_FOUND, '活动不存在')

    const [host, recommend, signup] = await Promise.all([
      a.hostId ? this.prisma.user.findUnique({ where: { id: a.hostId } }) : null,
      this.prisma.activity.findMany({
        where: { cityId: a.cityId, status: 1, deletedAt: null, id: { not: a.id } },
        orderBy: { startAt: 'asc' },
        take: 4,
      }),
      userId
        ? this.prisma.activitySignup.findFirst({
            where: { activityId: id, userId, status: { in: [0, 1] } },
          })
        : null,
    ])

    const sessions = ((a.sessions as any[]) ?? []).map((s) => {
      const d = dayjs(s.startAt)
      return {
        ...s,
        weekText: WEEK[d.day()],
        monthText: MONTH[d.month()],
        dateText: d.format('MM.DD'),
        full: s.joinedCount >= s.capacity,
      }
    })

    const full = a.joinedCount >= a.capacity
    const ended = dayjs(a.endAt ?? a.startAt).isBefore(dayjs())

    return {
      id: a.id,
      title: a.title,
      coverUrl: a.coverUrl,
      tags: (a.tags as string[]) ?? [],
      refundPolicy: a.refundPolicy,
      sessions,
      poiName: a.poiName,
      address: a.address,
      lat: a.lat ? Number(a.lat) : null,
      lng: a.lng ? Number(a.lng) : null,
      distanceText: null,
      joinedCount: a.joinedCount,
      capacity: a.capacity,
      joinedText: `${a.capacity}人一起`,
      highlights: (a.highlights as any[]) ?? [],
      host: host
        ? { id: host.id, name: host.nickname, avatarUrl: host.avatarUrl, followed: false }
        : null,
      joinState: signup && signup.status === 1 ? 'joined' : ended ? 'ended' : full ? 'full' : 'none',
      recommend: recommend.map((r) => ({
        id: r.id,
        coverUrl: r.coverUrl,
        title: r.title,
        joinText: `${r.joinedCount}人已上车`,
        dateText: dayjs(r.startAt).format('MM.DD'),
        statusText: r.joinedCount >= r.capacity ? '已满' : '报名中',
      })),
    }
  }

  async signup(id: string, userId: string, dto: SignupDto) {
    const a = await this.prisma.activity.findUnique({ where: { id } })
    if (!a || a.deletedAt) throw new BizException(ERR.NOT_FOUND, '活动不存在')
    if (a.status !== 1) throw new BizException(ERR.ACTIVITY_CLOSED, '活动已结束')

    const exist = await this.prisma.activitySignup.findFirst({
      where: { activityId: id, userId, status: { in: [0, 1] } },
    })
    if (exist) {
      if (exist.status === 1) throw new BizException(ERR.DUPLICATE_SIGNUP, '你已报名该活动')
      const order = await this.prisma.payOrder.findFirst({ where: { signupId: exist.id, status: 0 } })
      if (order) {
        return {
          signupId: exist.id,
          needPay: true,
          orderId: order.id,
          amountCent: order.amountCent,
          expireAt: order.expireAt.toISOString(),
        }
      }
      throw new BizException(ERR.DUPLICATE_SIGNUP, '你已报名该活动')
    }

    // 名额控制：条件更新，避免超卖
    const affected = await this.prisma.$executeRaw`
      UPDATE activity SET joined_count = joined_count + 1
      WHERE id = ${id} AND joined_count < capacity`
    if (Number(affected) === 0) throw new BizException(ERR.ACTIVITY_FULL, '名额已满')

    const signup = await this.prisma.activitySignup.create({
      data: {
        id: newId('s_'),
        activityId: id,
        userId,
        sessionAt: dto.sessionAt ? new Date(dto.sessionAt) : a.startAt,
        nickname: dto.nickname,
        gender: dto.gender ?? 0,
        avatarUrl: dto.avatarUrl ?? null,
        extra: dto.extra ?? {},
        status: 0,
      },
    })

    if (a.priceCent === 0) {
      await this.prisma.activitySignup.update({ where: { id: signup.id }, data: { status: 1 } })
      const ticket = await this.tickets.issue({
        userId,
        type: 1,
        refId: id,
        title: a.title,
        coverUrl: a.coverUrl,
        sessionAt: signup.sessionAt,
      })
      return { signupId: signup.id, needPay: false, ticketId: ticket.id }
    }

    const order = await this.prisma.payOrder.create({
      data: {
        id: newId('o_'),
        orderNo: newOrderNo(),
        userId,
        bizType: 1,
        bizId: id,
        signupId: signup.id,
        title: a.title,
        coverUrl: a.coverUrl,
        amountCent: a.priceCent,
        status: 0,
        expireAt: dayjs().add(15, 'minute').toDate(),
      },
    })
    await this.prisma.activitySignup.update({ where: { id: signup.id }, data: { orderId: order.id } })

    return {
      signupId: signup.id,
      needPay: true,
      orderId: order.id,
      amountCent: order.amountCent,
      expireAt: order.expireAt.toISOString(),
    }
  }
}
