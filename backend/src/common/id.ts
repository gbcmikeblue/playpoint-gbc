import { randomBytes } from 'crypto'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/** 生成 32 位内的短 ID：6 位时间 + 10 位随机（满足 varchar(32)） */
export function newId(prefix = ''): string {
  const ts = Date.now().toString(36)
  const rand = randomBytes(8).toString('hex').slice(0, 10)
  return `${prefix}${ts}${rand}`
}

/** 订单号：YYMMDD + 6 位序列（示意实现，生产需用独立序列） */
export function newOrderNo(): string {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  return `${ymd}${seq}`
}

export function newQrToken(): string {
  return `qr_${randomBytes(12).toString('hex')}`
}
