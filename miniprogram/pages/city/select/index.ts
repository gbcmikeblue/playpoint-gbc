import { api } from '../../../services/api'
import { appStore, setCity } from '../../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    located: appStore.state.city,
    hot: [] as any[],
    groups: [] as any[],
    letters: [] as string[],
    current: 'A',
    loading: true,
    error: false,
    scrollTo: '',
  },

  onLoad() {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight })
    this.load()
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const res = await api.cities()
      this.setData({
        located: res.located || appStore.state.city,
        hot: res.hot ?? [],
        groups: res.groups ?? [],
        letters: (res.groups ?? []).map((g: any) => g.initial),
        current: (res.groups ?? [])[0]?.initial ?? 'A',
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false, error: true })
    }
  },

  onPick(e: any) {
    const code = e.currentTarget.dataset.code
    const name = e.currentTarget.dataset.name
    if (!code) return
    setCity({ code, name })
    wx.navigateBack()
  },

  onLetter(e: any) {
    const l = e.currentTarget.dataset.l
    this.setData({ current: l, scrollTo: `letter-${l}` })
  },

  onLocate() {
    wx.getFuzzyLocation({
      type: 'wgs84',
      success: () => {
        const located = this.data.located
        if (located?.code) {
          setCity({ code: located.code, name: located.name })
          wx.navigateBack()
        }
      },
      fail: () => {
        wx.showToast({ title: '定位未授权，可手动选择', icon: 'none' })
      },
    })
  },

  onRetry() {
    this.load()
  },
})
