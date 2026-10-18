/** 环境配置：通过 __wxConfig.envVersion 自动切换，禁止在业务代码里判断环境 */
const envVersion = (() => {
  try {
    // @ts-ignore 微信内部字段
    return (__wxConfig && __wxConfig.envVersion) || 'develop'
  } catch {
    return 'develop'
  }
})()

const MAP: Record<string, { baseURL: string; mock: boolean }> = {
  develop: { baseURL: 'http://localhost:3000/api/v1', mock: false },
  trial: { baseURL: 'https://test-api.playpoint.local/api/v1', mock: true },
  release: { baseURL: 'https://api.playpoint.local/api/v1', mock: false },
}

export const env = {
  envVersion,
  ...(MAP[envVersion] ?? MAP.develop),
  /** 每次 wx.login 的 code 都不同；mock 登录时固定用 dev 保持同一账号 */
  mockLoginCode: 'dev',
}
