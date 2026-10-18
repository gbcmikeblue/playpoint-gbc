import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
/** 标记接口无需登录（但仍会尝试解析 token 以支持个性化） */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
