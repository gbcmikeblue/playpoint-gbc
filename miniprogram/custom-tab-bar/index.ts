Component({
  data: {
    selected: 0,
    unread: 0,
    list: [
      { path: '/pages/home/index', text: '玩点', icon: '🏠', fab: false },
      { path: '/pages/campaign/list/index', text: '打卡', icon: '🎫', fab: false },
      { path: '__publish__', text: '', icon: '+', fab: true },
      { path: '/pages/message/index', text: '消息', icon: '💬', fab: false },
      { path: '/pages/mine/index', text: '我的', icon: '👤', fab: false },
    ],
  },
  methods: {
    onTap(e: any) {
      const i = Number(e.currentTarget.dataset.i)
      const item = this.data.list[i]
      if (item.path === '__publish__') {
        wx.showToast({ title: '发布功能 M1 开放', icon: 'none' })
        return
      }
      wx.switchTab({ url: item.path })
    },
  },
})
