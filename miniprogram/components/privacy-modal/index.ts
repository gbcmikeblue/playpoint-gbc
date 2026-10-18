Component({
  options: { addGlobalClass: true },
  properties: {
    visible: { type: Boolean, value: false },
    version: { type: String, value: '1' },
    appName: { type: String, value: '玩点' },
  },
  methods: {
    onAgree() {
      this.triggerEvent('agree')
    },
    onDisagree() {
      wx.showModal({
        title: '提示',
        content: '不同意将无法使用本小程序的完整功能，确定要退出吗？',
        confirmText: '仍不同意',
        cancelText: '再想想',
        success: (r) => {
          if (r.confirm) this.triggerEvent('disagree')
        },
      })
    },
    openAgreement(e: any) {
      const type = e.currentTarget.dataset.type
      wx.navigateTo({ url: `/pkg-profile/pages/agreement/index?type=${type}` })
    },
    noop() {},
  },
})
