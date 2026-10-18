import { appStore } from '../../stores/app'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    /** normal(白底) | immersive(透明白字) | transparent */
    mode: { type: String, value: 'normal' },
    back: { type: Boolean, value: true },
    scrollTop: { type: Number, value: 0 },
    align: { type: String, value: 'center' },
  },
  data: {
    statusBarHeight: 20,
    navHeight: 64,
    capsuleW: 87,
    solid: false,
  },
  lifetimes: {
    attached() {
      const s = appStore.state
      this.setData({
        statusBarHeight: s.statusBarHeight,
        navHeight: s.navHeight,
        capsuleW: (s.capsule?.width ?? 87) + 16,
      })
    },
  },
  observers: {
    scrollTop(v: number) {
      this.setData({ solid: v > 120 })
    },
  },
  methods: {
    onBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) wx.navigateBack()
      else wx.switchTab({ url: '/pages/home/index' })
    },
  },
})
