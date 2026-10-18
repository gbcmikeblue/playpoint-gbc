import { api } from '../../../services/api'
import { appStore } from '../../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    orderId: '',
    order: null as any,
    countdown: '',
    expired: false,
    paying: false,
  },

  timer: 0 as any,

  onLoad(options: any) {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight, orderId: options.orderId || '' })
  },

  onShow() {
    this.load()
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },

  async load() {
    try {
      const order = await api.orderDetail(this.data.orderId)
      this.setData({ order })
      this.startCountdown(order)
    } catch (e) {
      /* toast 已由请求层处理 */
    }
  },

  startCountdown(order: any) {
    if (this.timer) clearInterval(this.timer)
    if (order.status !== 0) {
      this.setData({ expired: order.status !== 1, countdown: '' })
      return
    }

    const end = new Date(order.expireAt).getTime()
    const tick = () => {
      const left = end - Date.now()
      if (left <= 0) {
        clearInterval(this.timer)
        this.timer = 0
        this.setData({ countdown: '00:00', expired: true })
        return
      }
      const m = Math.floor(left / 60000)
      const s = Math.floor((left % 60000) / 1000)
      this.setData({ countdown: `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`, expired: false })
    }
    tick()
    this.timer = setInterval(tick, 1000)
  },

  async onPay() {
    if (this.data.paying || this.data.expired) return
    this.setData({ paying: true })
    try {
      const res = await api.mockPay(this.data.orderId)
      if (this.timer) clearInterval(this.timer)
      wx.redirectTo({
        url: `/pages/order/result/index?status=success&ticketId=${res.ticketId || ''}&orderId=${this.data.orderId}`,
      })
    } catch (e) {
      this.setData({ paying: false })
      this.load()
    }
  },

  onCancel() {
    wx.showModal({
      title: '放弃支付？',
      content: '订单 15 分钟内有效，超时会自动关闭',
      success: (r) => {
        if (r.confirm) wx.navigateBack()
      },
    })
  },

  onAgreement() {
    wx.showToast({ title: '支付说明为占位文案', icon: 'none' })
  },
})
