import { api } from '../../../services/api'
import { appStore } from '../../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    tab: 0,
    list: [] as any[],
    all: [] as any[],
    loading: true,
    error: false,
  },

  onLoad() {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight })
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const res = await api.tickets()
      const all = res.list ?? []
      this.setData({ all, list: this.filter(all, this.data.tab), loading: false })
    } catch (e) {
      this.setData({ loading: false, error: true })
    }
  },

  filter(all: any[], tab: number) {
    return tab === 1 ? all.filter((t) => t.status === 1) : all
  },

  onTab(e: any) {
    const tab = Number(e.currentTarget.dataset.i)
    this.setData({ tab, list: this.filter(this.data.all, tab) })
  },

  onOpen(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/ticket/detail/index?id=${id}` })
  },

  onVerify(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/ticket/detail/index?id=${id}&auto=1` })
  },

  onMore() {
    wx.showToast({ title: '更多操作 M1 后开放', icon: 'none' })
  },

  onRetry() {
    this.load()
  },

  onHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
