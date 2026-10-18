import { appStore } from '../../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    success: true,
    ticketId: '',
    orderId: '',
  },

  onLoad(options: any) {
    this.setData({
      statusBarHeight: appStore.state.statusBarHeight,
      success: options.status !== 'fail',
      ticketId: options.ticketId || '',
      orderId: options.orderId || '',
    })
  },

  onViewTicket() {
    if (!this.data.ticketId) {
      this.onTicketList()
      return
    }
    wx.redirectTo({ url: `/pages/ticket/detail/index?id=${this.data.ticketId}` })
  },

  onTicketList() {
    wx.redirectTo({ url: '/pages/ticket/list/index' })
  },

  onHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
