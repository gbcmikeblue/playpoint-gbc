import { createStore } from './store'
import { KEYS, get, set } from '../utils/storage'

export interface AppState {
  ready: boolean
  loggedIn: boolean
  user: any
  config: any
  city: { code: string; name: string }
  statusBarHeight: number
  navHeight: number
  capsule: { top: number; bottom: number; left: number; width: number; height: number } | null
  privacyVisible: boolean
  unread: number
}

export const appStore = createStore<AppState>({
  ready: false,
  loggedIn: false,
  user: null,
  config: null,
  city: get(KEYS.city, { code: 'shenzhen', name: '深圳市' }) as any,
  statusBarHeight: 20,
  navHeight: 64,
  capsule: null,
  privacyVisible: false,
  unread: 0,
})

export function initSystemInfo() {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync() as any)
    const capsule = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = info.statusBarHeight ?? 20
    // 导航栏高度 = 状态栏 + (胶囊高 + 上下间距)
    const navHeight = statusBarHeight + (capsule.height - statusBarHeight > 0 ? 44 : 44)
    appStore.set({ statusBarHeight, navHeight, capsule })
  } catch {
    appStore.set({ statusBarHeight: 20, navHeight: 64 })
  }
}

export function setCity(city: { code: string; name: string }) {
  set(KEYS.city, city)
  appStore.set({ city })
}
