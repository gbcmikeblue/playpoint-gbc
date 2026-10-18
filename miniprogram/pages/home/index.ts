import { api } from '../../services/api'
import { appStore, setCity } from '../../stores/app'
import { KEYS, get, set } from '../../utils/storage'

Page({
  data: {
    statusBarHeight: 20,
    headerRight: 200,
    cityName: '深圳市',
    banners: [] as any[],
    categories: [] as any[],
    ad: null as any,
    guide: null as any,
    list: [] as any[],
    loading: true,
    error: false,
    hasMore: false,
    cursor: '',
    activeCategory: 'cat_hot',
    sort: 'comprehensive',
    privacyVisible: false,
    agreementVersion: '1',
  },

  onLoad() {
    const s = appStore.state
    const win = wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync() as any)
    const cap = s.capsule
    const headerRight = cap ? Math.round(win.windowWidth - cap.left + 8) : 110
    this.setData({
      statusBarHeight: s.statusBarHeight,
      headerRight,
      cityName: s.city?.name ?? '深圳市',
    })
  },

  onShow() {
    const tb = this.getTabBar && this.getTabBar()
    if (tb) tb.setData({ selected: 0 })
    this.syncPrivacy()
    if (!this.data.list.length) this.load(true)
  },

  syncPrivacy() {
    const cfg = appStore.state.config
    const agreed = get<string>(KEYS.privacyVersion)
    this.setData({
      privacyVisible: !!cfg && agreed !== cfg.agreementVersion,
      agreementVersion: cfg?.agreementVersion ?? '1',
    })
  },

  async load(reset = false) {
    if (this.data.loading && !reset) return
    this.setData({ loading: true, error: false })
    try {
      const res = await api.homeFeed({
        city: appStore.state.city?.code,
        categoryId: this.data.activeCategory,
        sort: this.data.sort,
        cursor: reset ? undefined : this.data.cursor || undefined,
        limit: 20,
      })
      this.setData({
        banners: res.banners ?? [],
        categories: res.categories ?? [],
        ad: res.ad ?? null,
        guide: res.guide ?? null,
        list: reset ? res.list : [...this.data.list, ...res.list],
        cursor: res.nextCursor ?? '',
        hasMore: !!res.hasMore,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false, error: true })
    }
  },

  onRetry() {
    this.load(true)
  },

  onPullDownRefresh() {
    this.load(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.load(false)
  },

  onCategoryTap(e: any) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id, cursor: '' })
    this.load(true)
  },

  onCityTap() {
    wx.showToast({ title: '城市选择 M1 开放', icon: 'none' })
  },

  onSearchTap() {
    wx.showToast({ title: '搜索 M1 开放', icon: 'none' })
  },

  onSortTap() {
    wx.showActionSheet({
      itemList: ['综合排序', '时间最近', '离我最近'],
      success: (r) => {
        const sort = ['comprehensive', 'latest', 'nearby'][r.tapIndex]
        this.setData({ sort })
        this.load(true)
      },
    })
  },

  onFilterTap() {
    wx.showToast({ title: '筛选 M1 开放', icon: 'none' })
  },

  onActivityTap(e: any) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `活动详情 ${id}（M1 开放）`, icon: 'none' })
  },

  onPrivacyAgree() {
    const v = this.data.agreementVersion
    ;(getApp() as any).markPrivacyAgreed(v)
    api.consent(v).catch(() => {})
    this.setData({ privacyVisible: false })
  },

  onPrivacyDisagree() {
    wx.showToast({ title: '需同意后才能继续使用', icon: 'none' })
  },

  noop() {},
})
