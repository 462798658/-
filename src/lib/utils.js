export const pad2 = (n) => String(n).padStart(2, '0')

export function dateKey(input = new Date()) {
  if (typeof input === 'string') return input.slice(0, 10)
  const d = input
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayKey() {
  return dateKey(new Date())
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function shiftKey(key, days) {
  const d = parseKey(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

export function nowISO() {
  return new Date().toISOString()
}

export function formatDateCN(key) {
  if (!key) return ''
  const d = parseKey(key.slice(0, 10))
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function weekdayCN(key) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[parseKey(key.slice(0, 10)).getDay()]
}

export function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时 ${m} 分`
  if (m > 0) return `${m} 分 ${s % 60} 秒`
  return `${s} 秒`
}

export function clockText(sec) {
  const s = Math.max(0, Math.round(sec))
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

export function isIntInRange(value, min, max) {
  const n = Number(value)
  return Number.isInteger(n) && n >= min && n <= max
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
