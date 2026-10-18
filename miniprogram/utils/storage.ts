export const KEYS = {
  token: 'cm_token',
  refreshToken: 'cm_refresh',
  privacyVersion: 'cm_privacy_version',
  city: 'cm_city',
  mock: 'cm_mock',
} as const

export function get<T = any>(key: string, fallback: T | null = null): T | null {
  try {
    const v = wx.getStorageSync(key)
    return v === '' || v === undefined || v === null ? fallback : (v as T)
  } catch {
    return fallback
  }
}

export function set(key: string, value: any) {
  try {
    wx.setStorageSync(key, value)
  } catch {
    /* ignore */
  }
}

export function remove(key: string) {
  try {
    wx.removeStorageSync(key)
  } catch {
    /* ignore */
  }
}
