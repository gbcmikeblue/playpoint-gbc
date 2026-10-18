export const KEYS = {
  token: 'pp_token',
  refreshToken: 'pp_refresh',
  privacyVersion: 'pp_privacy_version',
  city: 'pp_city',
  mock: 'pp_mock',
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
