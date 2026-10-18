import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { PrismaService } from '../prisma/prisma.service'
import { BizException, ERR } from '../common/biz.exception'
import { newId, newOrderNo } from '../common/id'
import { TicketService } from '../ticket/ticket.service'

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketService,
  ) {}

  async create(userId: string, bizType: number, bizId: string, signupId?: string) {
    // 复用待支付单
    const exist = await this.prisma.payOrder.findFirst({
      where: { userId, bizType, bizId, status: 0, signupId: signupId ?? undefined },
      orderBy: { createdAt: 'desc' },
    })
    if (exist && dayjs(exist.expireAt).isAfter(dayjs())) {
      return {
        orderId: exist.id,
        orderNo: exist.orderNo,
        amountCent: exist.amountCent,
        expireAt: exist.expireAt.toISOString(),
        reused: true,
      }
    }

    let title = '订单'
    let coverUrl: string | null = null
    let amountCent = 0
    if (bizType === 1) {
      const a = await this.prisma.activity.findUnique({ where: { id: bizId } })
      if (!a) throw new BizException(ERR.NOT_FOUND, '活动不存在')
      title = a.title
      coverUrl = a.coverUrl
      amountCent = a.priceCent
    } else {
      const c = await this.prisma.campaign.findUnique({ where: { id: bizId } })
      if (!c) throw new BizException(ERR.NOT_FOUND, '挑战赛不存在')
      title = c.title
      coverUrl = c.bannerUrl
      amountCent = c.priceCent
    }
    if (amountCent <= 0) throw new BizException(ERR.ORDER_AMOUNT_MISMATCH, '该内容无需支付')

    const order = await this.prisma.payOrder.create({
      data: {
        id: newId('o_'),
        orderNo: newOrderNo(),
        userId,
        bizType,
        bizId,
        signupId: signupId ?? null,
        title,
        coverUrl,
        amountCent,
        status: 0,
        expireAt: dayjs().add(15, 'minute').toDate(),
      },
    })

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      amountCent: order.amountCent,
      expireAt: order.expireAt.toISOString(),
      reused: false,
    }
  }

  async get(id: string, userId: string) {
    const o = await this.prisma.payOrder.findUnique({ where: { id } })
    if (!o || o.userId !== userId) throw new BizException(ERR.ORDER_NOT_FOUND, '订单不存在')

    // 惰性关单：过期且仍待支付，直接置为已过期
    if (o.status === 0 && dayjs(o.expireAt).isBefore(dayjs())) {
      await this.prisma.payOrder.update({ where: { id }, data: { status: 3 } })
      o.status = 3
    }

    const activity = o.bizType === 1 ? await this.prisma.activity.findUnique({ where: { id: o.bizId } }) : null
    const sessionAt = o.signupId
      ? (await this.prisma.activitySignup.findUnique({ where: { id: o.signupId } }))?.sessionAt
      : null

    return {
      orderId: o.id,
      orderNo: o.orderNo,
      title: o.title,
      coverUrl: o.coverUrl,
      sessionText: sessionAt ? dayjs(sessionAt).format('MM月DD日 HH:mm') : '',
      poiName: activity?.poiName ?? null,
      amountCent: o.amountCent,
      discountCent: 0,
      payableCent: o.amountCent,
      status: o.status,
      statusText: ['待支付', '已支付', '已取消', '已过期'][o.status] ?? '未知',
      payChannel: o.payChannel,
      expireAt: o.expireAt.toISOString(),
      serverTime: new Date().toISOString(),
    }
  }

  /** 模拟支付：事务内 订单→已支付、报名→已报名、名额+1、出票 */
  async mockPay(id: string, userId: string) {
    const o = await this.prisma.payOrder.findUnique({ where: { id } })
    if (!o || o.userId !== userId) throw new BizException(ERR.ORDER_NOT_FOUND, '订单不存在')

    if (o.status === 1) {
      const ticket = await this.prisma.ticket.findFirst({ where: { refId: o.bizId, userId } })
      return { status: 1, paidAt: o.paidAt?.toISOString(), ticketId: ticket?.id ?? null }
    }
    if (o.status !== 0) throw new BizException(ERR.ORDER_EXPIRED, '订单已过期或已取消')
    if (dayjs(o.expireAt).isBefore(dayjs())) {
      await this.prisma.payOrder.update({ where: { id }, data: { status: 3 } })
      throw new BizException(ERR.ORDER_EXPIRED, '订单已过期')
    }

    const paidAt = new Date()
    await this.prisma.$transaction([
      this.prisma.payOrder.update({ where: { id }, data: { status: 1, paidAt } }),
      ...(o.signupId
        ? [this.prisma.activitySignup.update({ where: { id: o.signupId }, data: { status: 1 } })]
        : []),
    ])

    let ticketId: string | null = null
    if (o.bizType === 1) {
      const signup = o.signupId ? await this.prisma.activitySignup.findUnique({ where: { id: o.signupId } }) : null
      const ticket = await this.tickets.issue({
        userId,
        type: 1,
        refId: o.bizId,
        title: o.title,
        coverUrl: o.coverUrl,
        sessionAt: signup?.sessionAt ?? null,
      })
      ticketId = ticket.id
    }

    return { status: 1, paidAt: paidAt.toISOString(), ticketId }
  }
}
