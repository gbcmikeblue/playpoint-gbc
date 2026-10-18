import { appStore } from '../../stores/app'

Page({
  data: {
    statusBarHeight: 20,
    conversations: [
      {
        id: 'c1',
        name: '小咪｜主理人助理',
        digest: '[自定义消息]',
        time: '刚刚',
        unread: 1,
        avatar: '',
        gender: 0,
      },
      {
        id: 'c2',
        name: '官方小助手',
        digest: '[图片]',
        time: '刚刚',
        unread: 2,
        avatar: '',
        gender: 1,
      },
    ],
  },

  onLoad() {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight })
  },

  onShow() {
    const tb = this.getTabBar && this.getTabBar()
    if (tb) tb.setData({ selected: 3, unread: appStore.state.unread })
  },

  onNotice() {
    wx.showToast({ title: '通知列表 M2 开放', icon: 'none' })
  },

  onChat(e: any) {
    wx.showToast({ title: `会话 ${e.currentTarget.dataset.id}（M2 开放）`, icon: 'none' })
  },
})
