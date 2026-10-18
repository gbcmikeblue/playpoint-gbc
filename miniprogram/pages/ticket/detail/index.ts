import { api } from '../../../services/api'
import { appStore } from '../../../stores/app'

const MODULES = 29

function hashStr(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 用 token 生成一个确定性的“像二维码”的点阵（练习项目，不做真实扫码识别） */
function buildMatrix(token: string) {
  let seed = hashStr(token) || 1
  const rnd = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
    return seed / 4294967296
  }
  const m: boolean[][] = []
  for (let y = 0; y < MODULES; y++) {
    const row: boolean[] = []
    for (let x = 0; x < MODULES; x++) row.push(rnd() > 0.52)
    m.push(row)
  }

  const finder = (x0: number, y0: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gx = x0 + x
        const gy = y0 + y
        if (gx < 0 || gy < 0 || gx >= MODULES || gy >= MODULES) continue
        const edge = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        m[gy][gx] = edge || core
      }
    }
  }
  finder(0, 0)
  finder(MODULES - 7, 0)
  finder(0, MODULES - 7)
  return m
}

Page({
  data: {
    statusBarHeight: 20,
    ticket: null as any,
    loading: true,
    error: false,
  },

  onLoad(options: any) {
    this.setData({ statusBarHeight: appStore.state.statusBarHeight, id: options.id || '' } as any)
  },

  onShow() {
    if (!this.data.ticket) this.load()
  },

  async load() {
    this.setData({ loading: true, error: false })
    try {
      const ticket = await api.ticketDetail((this.data as any).id)
      this.setData({ ticket, loading: false })
      if (ticket.qrToken) setTimeout(() => this.drawQr(ticket.qrToken), 60)
    } catch (e) {
      this.setData({ loading: false, error: true })
    }
  },

  drawQr(token: string) {
    const matrix = buildMatrix(token)
    wx.createSelectorQuery()
      .in(this)
      .select('#qr')
      .fields({ node: true, size: true })
      .exec((res: any) => {
        const item = res && res[0]
        if (!item || !item.node) return
        const canvas = item.node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
        const size = item.width
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        const cell = size / MODULES
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#111111'
        for (let y = 0; y < MODULES; y++) {
          for (let x = 0; x < MODULES; x++) {
            if (matrix[y][x]) ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5)
          }
        }
      })
  },

  onSave() {
    wx.showToast({ title: '练习项目不做保存', icon: 'none' })
  },

  onRetry() {
    this.load()
  },
})
