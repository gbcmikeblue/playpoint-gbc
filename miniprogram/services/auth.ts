import { api } from './api'
import { env } from '../config/env'
import { appStore } from '../stores/app'
import { KEYS, get, remove, set } from '../utils/storage'

/** 微信登录（本地无 AppID 时后端走 mock） */
export async function login(): Promise<boolean> {
  try {
    const { code } = await wx.login()
    const data = await api.login(code || env.mockLoginCode)
    set(KEYS.token, data.token)
    set(KEYS.refreshToken, data.refreshToken)
    appStore.set({ loggedIn: true, user: data.user })
    return true
  } catch (e) {
    console.error('[auth] login failed', e)
    appStore.set({ loggedIn: false })
    return false
  }
}

export function logout() {
  remove(KEYS.token)
  remove(KEYS.refreshToken)
  appStore.set({ loggedIn: false, user: null })
}

/** 有 token 视为已登录；无 token 则静默登录 */
export async function ensureLogin(): Promise<boolean> {
  const token = get<string>(KEYS.token)
  if (token) {
    appStore.set({ loggedIn: true })
    return true
  }
  return login()
}
