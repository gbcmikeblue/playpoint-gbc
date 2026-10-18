import { api } from '../../../services/api'
import { appStore } from '../../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    list: [] as any[],
    loading: true,
    error: false,
  },

  onLoad() {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight })
    this.load()
  },

  onShow() {
    const tb = this.getTabBar && this.getTabBar()
    if (tb) tb.setData({ selected: 1 })
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const res = await api.campaigns(appStore.state.city?.code)
      this.setData({ list: res.list ?? [], loading: false })
    } catch {
      this.setData({ loading: false, error: true })
    }
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh())
  },

  onOpen(e: any) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `挑战赛 ${id}（M1 开放）`, icon: 'none' })
  },

  onCheckin(e: any) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `打卡 ${id}（M1 开放）`, icon: 'none' })
  },

  noop() {},
})
