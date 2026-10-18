import { api } from '../../../services/api'
import { env } from '../../../config/env'
import { appStore } from '../../../stores/app'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

function timeText(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${WEEK[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

Page({
  data: {
    statusBarHeight: 20,
    id: '',
    detail: null as any,
    loading: true,
    error: false,
    activeSession: 0,
    sheetVisible: false,
    nickname: '',
    gender: 1,
    submitting: false,
    isMock: false,
  },

  onLoad(options: any) {
    const user = appStore.state.user
    this.setData({
      statusBarHeight: appStore.state.statusBarHeight,
      id: options.id || '',
      nickname: user?.nickname || '',
      gender: user?.gender ?? 1,
      isMock: env.mock,
    })
    this.load()
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const detail = await api.activityDetail(this.data.id)
      const sessions = (detail.sessions ?? []).map((s: any) => ({
        ...s,
        timeText: timeText(s.startAt),
        countText: `${s.joinedCount}/${s.capacity}`,
      }))
      this.setData({
        detail: { ...detail, sessions, startText: sessions[0]?.timeText ?? '' },
        activeSession: 0,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false, error: true })
    }
  },

  onRetry() {
    this.load()
  },

  onSessionTap(e: any) {
    const i = Number(e.currentTarget.dataset.i)
    if (this.data.detail?.sessions?.[i]?.full) {
      wx.showToast({ title: '该场次已满', icon: 'none' })
      return
    }
    this.setData({ activeSession: i })
  },

  onSignupTap() {
    const d = this.data.detail
    if (!d) return
    if (d.joinState === 'joined') {
      wx.navigateTo({ url: '/pages/ticket/list/index' })
      return
    }
    if (d.joinState === 'full') {
      wx.showToast({ title: '名额已满', icon: 'none' })
      return
    }
    if (d.joinState === 'ended') {
      wx.showToast({ title: '活动已结束', icon: 'none' })
      return
    }
    this.setData({ sheetVisible: true })
  },

  onSheetClose() {
    if (this.data.submitting) return
    this.setData({ sheetVisible: false })
  },

  noop() {},

  onNickname(e: any) {
    this.setData({ nickname: e.detail.value })
  },

  onGender(e: any) {
    this.setData({ gender: Number(e.currentTarget.dataset.g) })
  },

  async onSubmit() {
    const d = this.data.detail
    if (!d || this.data.submitting) return

    const nickname = (this.data.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '给自己起个昵称', icon: 'none' })
      return
    }

    const session = d.sessions?.[this.data.activeSession]
    this.setData({ submitting: true })
    try {
      const res = await api.signup(d.id, {
        nickname,
        gender: this.data.gender,
        sessionAt: session?.startAt,
      })
      this.setData({ submitting: false, sheetVisible: false })

      if (res.needPay) {
        wx.navigateTo({ url: `/pages/order/cashier/index?orderId=${res.orderId}` })
      } else {
        wx.navigateTo({ url: `/pages/ticket/detail/index?id=${res.ticketId}` })
      }
      this.load()
    } catch (e) {
      this.setData({ submitting: false })
    }
  },

  onRecommendTap(e: any) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.id) return
    wx.redirectTo({ url: `/pages/activity/detail/index?id=${id}` })
  },

  onHostTap() {
    wx.showToast({ title: '主理人主页 M2 开放', icon: 'none' })
  },

  onMapTap() {
    const d = this.data.detail
    if (!d?.lat || !d?.lng) return
    wx.openLocation({
      latitude: d.lat,
      longitude: d.lng,
      name: d.poiName,
      address: d.address,
    })
  },
})
