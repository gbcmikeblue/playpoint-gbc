import { api } from './services/api'
import { ensureLogin } from './services/auth'
import { appStore, initSystemInfo } from './stores/app'
import { KEYS, get, set } from './utils/storage'

App({
  globalData: { launchError: null as string | null },

  async onLaunch() {
    initSystemInfo()

    // 1) 配置（分类 / 协议版本 / 首页运营位）
    try {
      const config = await api.config()
      appStore.set({ config })
      const cached = get<string>(KEYS.privacyVersion)
      appStore.set({ privacyVisible: cached !== config.agreementVersion })
    } catch (e) {
      console.warn('[app] load config failed, fallback to cache', e)
    }

    // 2) 登录（静默）
    await ensureLogin()

    // 3) ready
    appStore.set({ ready: true })
  },

  /** 隐私弹窗同意后调用 */
  markPrivacyAgreed(version: string) {
    set(KEYS.privacyVersion, version)
    appStore.set({ privacyVisible: false })
  },
})
