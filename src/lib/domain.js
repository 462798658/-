import { formatDateCN, isIntInRange, shiftKey, todayKey } from './utils'

export const POINTS = {
  reading: 15,
  calcPerPage: 5,
  neatBonus: 1,
}

export const ADMIN_PHONE = '13800000000'
export const ADMIN_PASSWORD = 'admin123'
export const DEMO_PHONE = '13812345678'
export const DEMO_PASSWORD = '123456'

const img = (prompt) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`

export const makeDefaultGifts = () => [
  {
    id: 'g_astro',
    name: '星空旅人头像',
    type: 'virtual',
    cost: 180,
    stock: null,
    avatar: true,
    image: img('Cute flat vector astronaut portrait avatar for a kids study app, soft mint background, centered, minimal, friendly illustration'),
    desc: '戴上头盔，向知识的宇宙出发。兑换后自动应用为头像。',
    unlock: { type: 'streak', value: 3 },
  },
  {
    id: 'g_sakura',
    name: '樱花少女头像',
    type: 'virtual',
    cost: 320,
    stock: null,
    avatar: true,
    image: img('Cute flat vector girl avatar with sakura flowers and soft pink background, centered, minimal, friendly illustration for a study app'),
    desc: '把春天的气息戴在头像上，学习也温柔起来。',
    unlock: { type: 'streak', value: 7 },
  },
  {
    id: 'g_medal',
    name: '金色学霸勋章',
    type: 'virtual',
    cost: 520,
    stock: null,
    image: img('Golden study achievement medal badge with star and laurel, flat vector icon, isolated on soft cream background'),
    desc: '累计坚持 21 天即可收入勋章陈列柜，永久保留。',
    unlock: { type: 'days', value: 21 },
  },
  {
    id: 'g_notebook',
    name: '布面精装笔记本',
    type: 'physical',
    cost: 300,
    budget: 29,
    stock: 20,
    image: img('Beautiful hardcover notebook stationery product photo, mint green cover, clean white background, soft shadows, minimal'),
    desc: 'A5 布面精装，100g 道林纸，记录每一次坚持。',
    unlock: { type: 'none' },
  },
  {
    id: 'g_stationery',
    name: '文具礼盒套装',
    type: 'physical',
    cost: 600,
    budget: 59,
    stock: 12,
    image: img('Colorful kids stationery gift set with pencils, notebooks and eraser, flat lay product photo, clean white background'),
    desc: '铅笔、橡皮、便签与笔记本，一套配齐。',
    unlock: { type: 'days', value: 7 },
  },
  {
    id: 'g_lamp',
    name: '护眼学习台灯',
    type: 'physical',
    cost: 1200,
    budget: 99,
    stock: 6,
    image: img('Modern eye-care LED desk lamp for students, white and mint colors, product photo on clean light background'),
    desc: '国AA级照度，三档色温，守护每一次夜间学习。',
    unlock: { type: 'days', value: 30 },
  },
  {
    id: 'g_custom',
    name: '终极心愿 · 自选商品',
    type: 'physical',
    cost: 2000,
    budget: 100,
    stock: 99,
    custom: true,
    image: img('Mystery gift box with sparkles and ribbon, flat vector illustration, cream background, warm and inviting'),
    desc: '解锁最高打卡阶梯后开放，可自选 100 元以内心仪好物。',
    unlock: { type: 'ladderMax' },
  },
].map((gift) => ({ isOnShelf: true, imageMediaId: null, ...gift }))

export const makeDefaultLadders = () => [
  {
    id: 'l_7',
    days: 7,
    name: '阅读新星',
    desc: '连续坚持一周，点亮新星勋章。',
    giftId: null,
  },
  {
    id: 'l_21',
    days: 21,
    name: '坚持之星',
    desc: '21 天养成好习惯，获得专属徽章一枚。',
    giftId: 'g_medal',
  },
  {
    id: 'l_30',
    days: 30,
    name: '学习达人',
    desc: '一个月的自律，解锁护眼台灯兑换资格。',
    giftId: 'g_lamp',
  },
  {
    id: 'l_60',
    days: 60,
    name: '自律王者',
    desc: '两个月不间断，开启终极心愿自选奖励。',
    giftId: 'g_custom',
  },
]

export const makeDefaultHomeworkConfig = () => ({
  totalPages: 300,
  mode: 'stages',
  dailyPages: 10,
  stages: [
    { id: 'hs_1', name: '初阶目标', pages: 50, order: 1 },
    { id: 'hs_2', name: '进阶目标', pages: 100, order: 2 },
    { id: 'hs_3', name: '高阶目标', pages: 150, order: 3 },
  ],
  updatedAt: new Date().toISOString(),
})

export const makeDefaultReadingConfig = () => ({
  minMinutes: 30,
  points: POINTS.reading,
  updatedAt: new Date().toISOString(),
})
export const makeDefaultCalcConfig = () => ({
  dailyLimit: 2,
  perSubmit: 1,
  pointsPerPage: POINTS.calcPerPage,
  neatBonus: POINTS.neatBonus,
  updatedAt: new Date().toISOString(),
})

export function homeworkProgress(config, totalPages) {
  const target = config.totalPages
  const stages = [...(config.stages || [])].sort((a, b) => a.order - b.order)
  let cumulative = 0
  const stageViews = stages.map((s) => {
    const start = cumulative
    cumulative += s.pages
    return {
      ...s,
      start,
      threshold: cumulative,
      unlocked: totalPages >= cumulative,
      percent: Math.min(100, Math.round((totalPages / cumulative) * 100)),
    }
  })
  const nextStage = stageViews.find((s) => !s.unlocked) || null
  return {
    target,
    stageViews,
    percent: Math.min(100, Math.round((totalPages / target) * 100)),
    nextStage,
  }
}

export function giftUnlockText(gift, ladders = []) {
  const u = gift.unlock || { type: 'none' }
  if (u.type === 'streak') return `连续打卡 ${u.value} 天解锁`
  if (u.type === 'days') return `累计打卡 ${u.value} 天解锁`
  if (u.type === 'ladderMax') {
    const max = Math.max(0, ...ladders.map((l) => l.days))
    return max ? `解锁最高阶梯（${max} 天）后开放` : '解锁最高阶梯后开放'
  }
  return '无门槛，可直接兑换'
}

export function isGiftUnlocked(gift, user, unlocks, ladders = []) {
  const u = gift.unlock || { type: 'none' }
  if (u.type === 'none') return true
  if (!user) return false
  if (u.type === 'streak') return (user.streakDays || 0) >= u.value
  if (u.type === 'days') return (user.totalDays || 0) >= u.value
  if (u.type === 'ladderMax') {
    const max = Math.max(0, ...ladders.map((l) => l.days))
    const unlocked = unlocks?.ladders || []
    const maxUnlocked = Math.max(0, ...unlocked.map((l) => l.days))
    return max > 0 && maxUnlocked >= max
  }
  return false
}

export function nextLadderInfo(ladders, totalDays) {
  const sorted = [...ladders].sort((a, b) => a.days - b.days)
  const next = sorted.find((l) => l.days > totalDays)
  const prevDays = sorted.filter((l) => l.days <= totalDays).reduce((m, l) => Math.max(m, l.days), 0)
  if (!next) return { next: null, percent: 100, remaining: 0, prevDays }
  const span = next.days - prevDays
  const percent = Math.min(100, Math.round(((totalDays - prevDays) / span) * 100))
  return { next, percent: Math.max(0, percent), remaining: next.days - totalDays, prevDays }
}

export function validateLadderForm(form) {
  if (!isIntInRange(form.days, 1, 3650)) return '累计打卡天数需为 1-3650 的正整数'
  if (!form.name || !form.name.trim()) return '请填写奖励名称'
  if (form.name.trim().length > 20) return '奖励名称不超过 20 个字'
  if ((form.desc || '').length > 60) return '奖励说明不超过 60 个字'
  return null
}

export function validateHomeworkForm(form) {
  if (!isIntInRange(form.totalPages, 1, 10000)) return '累计总页数需为 1-10000 的正整数'
  if (form.mode === 'daily') {
    if (!isIntInRange(form.dailyPages, 1, 100)) return '每日目标页数需为 1-100 的正整数'
  } else {
    if (!form.stages || form.stages.length === 0) return '请至少添加一个任务阶段'
    for (const s of form.stages) {
      if (!s.name || !s.name.trim()) return '请填写阶段名称'
      if (!isIntInRange(s.pages, 1, 10000)) return '阶段页数需为 1-10000 的正整数'
    }
  }
  return null
}

export function validateGiftForm(form, { hasNewImage = false } = {}) {
  if (!form.name || !form.name.trim()) return '请填写礼品名称'
  if (form.name.trim().length > 30) return '礼品名称不超过 30 个字'
  if (!['virtual', 'physical'].includes(form.type)) return '请选择正确的礼品类型'
  if (!isIntInRange(form.cost, 1, 1000000)) return '兑换积分需为 1-1000000 的正整数'
  const image = (form.image || '').trim()
  if (!hasNewImage && !form.imageMediaId) {
    if (!image) return '请选择礼品图片'
    if (image.length > 2048 || !(/^https:\/\/\S+$/.test(image) || /^\/(?!\/)\S+$/.test(image))) {
      return '原图片地址无效，请重新选择图片'
    }
  }
  if ((form.desc || '').length > 120) return '礼品说明不超过 120 个字'
  if (form.type === 'physical') {
    if (form.stock === '' || form.stock === null || form.stock === undefined || !isIntInRange(form.stock, 0, 1000000)) {
      return '库存需为 0-1000000 的整数'
    }
    const budget = Number(form.budget)
    if (!Number.isFinite(budget) || budget <= 0 || budget > 100) return '实物预算需大于 0 且不超过 100 元'
  }
  const unlock = form.unlock || { type: 'none' }
  if (!['none', 'streak', 'days', 'ladderMax'].includes(unlock.type)) return '请选择正确的解锁条件'
  if (['streak', 'days'].includes(unlock.type) && !isIntInRange(unlock.value, 1, 3650)) {
    return '解锁天数需为 1-3650 的正整数'
  }
  return null
}

export function todayRangeLabel() {
  return formatDateCN(todayKey())
}

export function tomorrowKey() {
  return shiftKey(todayKey(), 1)
}
