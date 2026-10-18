/** 环境配置：通过 __wxConfig.envVersion 自动切换，禁止在业务代码里判断环境 */
const envVersion = (() => {
  try {
    // @ts-ignore 微信内部字段
    return (__wxConfig && __wxConfig.envVersion) || 'develop'
  } catch {
    return 'develop'
  }
})()

/**
 * mock：请求层直接返回本地数据（services/mock），不连后端。
 * - develop（含真机预览）默认开启，手机扫预览码即可跑通全链路
 * - 运行期可在「我的 → 设置」或 dev 页切换，结果存 storage（pp_mock）
 * - trial / release 关闭，避免体验版连到假数据
 */
const MAP: Record<string, { baseURL: string; mock: boolean }> = {
  develop: { baseURL: 'http://localhost:3000/api/v1', mock: true },
  trial: { baseURL: 'https://test-api.playpoint.local/api/v1', mock: false },
  release: { baseURL: 'https://api.playpoint.local/api/v1', mock: false },
}

export const env = {
  envVersion,
  ...(MAP[envVersion] ?? MAP.develop),
  /** 每次 wx.login 的 code 都不同；mock 登录时固定用 dev 保持同一账号 */
  mockLoginCode: 'dev',
}
