import { api } from '../../services/api'
import { appStore } from '../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    user: null as any,
    tab: 'played' as 'played' | 'ticket' | 'album',
    tickets: [] as any[],
    ticketsLoaded: false,
    ticketsLoading: false,
    grids: [
      { icon: '🏛️', title: '加入的俱乐部', sub: '历史加入记录' },
      { icon: '🧑‍🎤', title: '成为主理人', sub: '办活动，边玩边赚' },
      { icon: '💡', title: '问问', sub: '智能客服助手' },
      { icon: '📣', title: '组织活动', sub: '发起你的活动' },
    ],
  },

  onLoad() {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight })
  },

  onShow() {
    const tb = this.getTabBar && this.getTabBar()
    if (tb) tb.setData({ selected: 4 })
    this.setData({ user: appStore.state.user })
  },

  onTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
    if (tab === 'ticket' && !this.data.ticketsLoaded) this.loadTickets()
  },

  async loadTickets() {
    this.setData({ ticketsLoading: true })
    try {
      const res = await api.tickets(1)
      this.setData({ tickets: res.list ?? [], ticketsLoaded: true, ticketsLoading: false })
    } catch {
      this.setData({ ticketsLoading: false })
    }
  },

  onEdit() {
    wx.showToast({ title: '资料编辑 M2 开放', icon: 'none' })
  },

  onGrid(e: any) {
    wx.showToast({ title: `${e.currentTarget.dataset.title}（后续开放）`, icon: 'none' })
  },

  onTicket(e: any) {
    wx.showToast({ title: `取票页 ${e.currentTarget.dataset.id}（M1 开放）`, icon: 'none' })
  },
})
