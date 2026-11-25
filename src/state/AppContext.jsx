import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createSeedState, STORAGE_KEY } from '../lib/seed'
import {
  isGiftUnlocked,
  makeDefaultCalcConfig,
  makeDefaultReadingConfig,
  validateHomeworkForm,
  validateLadderForm,
  POINTS,
} from '../lib/domain'
import {
  dateKey,
  isIntInRange,
  nowISO,
  shiftKey,
  todayKey,
  uid,
} from '../lib/utils'
import { clearMedia } from '../lib/media'

const AppCtx = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === 1) {
        parsed.readingConfig = { ...makeDefaultReadingConfig(), ...(parsed.readingConfig || {}) }
        parsed.calcConfig = { ...makeDefaultCalcConfig(), ...(parsed.calcConfig || {}) }
        return parsed
      }
    }
  } catch {
    // ignore broken cache
  }
  const seeded = createSeedState()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    // ignore quota errors
  }
  return seeded
}

function addPoints(draft, userId, delta, type, label, refId) {
  const user = draft.users.find((u) => u.id === userId)
  if (!user || delta === 0) return
  user.points = Math.max(0, user.points + delta)
  draft.pointsLogs.unshift({
    id: uid('pl'),
    userId,
    type,
    label,
    points: delta,
    balanceAfter: user.points,
    refId: refId || null,
    createdAt: nowISO(),
  })
}

function recomputeProgress(draft, userId) {
  const user = draft.users.find((u) => u.id === userId)
  if (!user) return { newLadders: [], newStages: [] }
  const readingDates = draft.readingCheckins.filter((r) => r.userId === userId).map((r) => r.date)
  const calcDates = draft.calcCheckins.filter((c) => c.userId === userId).map((c) => c.date)
  const allDates = [...new Set([...readingDates, ...calcDates])].sort()
  user.totalDays = allDates.length
  user.totalPages = draft.calcCheckins
    .filter((c) => c.userId === userId)
    .reduce((sum, c) => sum + (c.pages || 1), 0)

  const set = new Set(allDates)
  const today = todayKey()
  const yesterday = shiftKey(today, -1)
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  let streak = 0
  while (cursor && set.has(cursor)) {
    streak += 1
    cursor = shiftKey(cursor, -1)
  }
  user.streakDays = streak
  user.lastCheckinDate = allDates.length ? allDates[allDates.length - 1] : null

  if (!draft.unlocks[userId]) draft.unlocks[userId] = { ladders: [], stages: [] }
  const ul = draft.unlocks[userId]
  const newLadders = []
  draft.ladders
    .slice()
    .sort((a, b) => a.days - b.days)
    .forEach((l) => {
      if (user.totalDays >= l.days && !ul.ladders.some((x) => x.id === l.id)) {
        const snap = { ...l, unlockedAt: nowISO() }
        ul.ladders.push(snap)
        newLadders.push(snap)
      }
    })

  const newStages = []
  const hw = draft.homeworkConfig
  if (hw.mode === 'stages') {
    let cumulative = 0
    ;[...hw.stages]
      .sort((a, b) => a.order - b.order)
      .forEach((s) => {
        cumulative += s.pages
        if (user.totalPages >= cumulative && !ul.stages.some((x) => x.stageId === s.id)) {
          const snap = {
            stageId: s.id,
            name: s.name,
            pages: s.pages,
            threshold: cumulative,
            unlockedAt: nowISO(),
          }
          ul.stages.push(snap)
          newStages.push(snap)
        }
      })
  }
  return { newLadders, newStages }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [toasts, setToasts] = useState([])
  const [celebration, setCelebration] = useState(null)
  const codesRef = useRef({})

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [state])

  const user = state.users.find((u) => u.id === state.session) || null

  const toast = (message, tone = 'default') => {
    const id = uid('t')
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id))
    }, 2800)
  }

  const dismissToast = (id) => setToasts((list) => list.filter((t) => t.id !== id))
  const dismissCelebration = () => setCelebration(null)

  const notifyUnlocks = (result) => {
    const ladders = result?.newLadders || []
    const stages = result?.newStages || []
    if (ladders.length || stages.length) setCelebration({ ladders, stages })
  }

  // ---------- auth ----------
  const sendCode = (phone) => {
    if (!/^1\d{10}$/.test(phone)) return { ok: false, message: '请输入正确的 11 位手机号' }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    codesRef.current[phone] = code
    return { ok: true, code }
  }

  const loginWithCode = (phone, code) => {
    const target = state.users.find((u) => u.phone === phone)
    if (!target) return { ok: false, message: '该手机号尚未注册，请先注册' }
    if (!code) return { ok: false, message: '请输入验证码' }
    if (codesRef.current[phone] !== code) return { ok: false, message: '验证码不正确，请重新获取' }
    setState((prev) => ({ ...prev, session: target.id }))
    delete codesRef.current[phone]
    return { ok: true }
  }

  const loginWithPassword = (phone, password) => {
    const target = state.users.find((u) => u.phone === phone)
    if (!target) return { ok: false, message: '该手机号尚未注册' }
    if (!password) return { ok: false, message: '请输入登录密码' }
    if (target.password !== password) return { ok: false, message: '手机号或密码错误' }
    setState((prev) => ({ ...prev, session: target.id }))
    return { ok: true }
  }

  const register = ({ phone, code, password, nickname }) => {
    if (!/^1\d{10}$/.test(phone)) return { ok: false, message: '请输入正确的 11 位手机号' }
    if (state.users.some((u) => u.phone === phone)) return { ok: false, message: '该手机号已注册，请直接登录' }
    if (codesRef.current[phone] !== code) return { ok: false, message: '验证码不正确，请重新获取' }
    if (!password || password.length < 6) return { ok: false, message: '登录密码至少 6 位' }
    if (!nickname || !nickname.trim()) return { ok: false, message: '请填写昵称' }
    const id = uid('u')
    setState((prev) => ({
      ...prev,
      session: id,
      users: [
        ...prev.users,
        {
          id,
          phone,
          password,
          nickname: nickname.trim().slice(0, 12),
          avatar: null,
          role: 'student',
          points: 0,
          streakDays: 0,
          totalDays: 0,
          totalPages: 0,
          lastCheckinDate: null,
          createdAt: nowISO(),
          ownedAvatars: [],
        },
      ],
    }))
    delete codesRef.current[phone]
    return { ok: true }
  }

  const logout = () => setState((prev) => ({ ...prev, session: null }))

  // ---------- check-ins ----------
  const completeReading = ({ durationSec, mediaId, mode }) => {
    if (!user) return { ok: false, message: '请先登录' }
    const required = state.readingConfig.minMinutes * 60
    if (!Number.isFinite(durationSec) || durationSec < required) {
      return { ok: false, message: `学习时长不足 ${state.readingConfig.minMinutes} 分钟，暂不能提交` }
    }
    const today = todayKey()
    if (state.readingCheckins.some((r) => r.userId === user.id && r.date === today)) {
      return { ok: false, message: '今日已完成阅读打卡，明天再来吧' }
    }
    const reward = state.readingConfig.points ?? POINTS.reading
    const draft = structuredClone(state)
    const record = {
      id: uid('rd'),
      userId: user.id,
      date: today,
      durationSec: Math.round(durationSec),
      mediaId: mediaId || null,
      mode: mode || 'watch',
      points: reward,
      createdAt: nowISO(),
    }
    draft.readingCheckins.unshift(record)
    addPoints(draft, user.id, reward, 'reading', '阅读打卡', record.id)
    const unlocks = recomputeProgress(draft, user.id)
    setState(draft)
    notifyUnlocks(unlocks)
    return { ok: true, points: reward, record, unlocks }
  }

  const completeCalc = ({ pages, images, review, neatBonus, accuracy }) => {
    if (!user) return { ok: false, message: '请先登录' }
    const today = todayKey()
    const usedPages = state.calcCheckins
      .filter((c) => c.userId === user.id && c.date === today)
      .reduce((s, c) => s + (c.pages || 1), 0)
    const remaining = state.calcConfig.dailyLimit - usedPages
    if (remaining <= 0) return { ok: false, message: '今日计算打卡页数已用完' }
    if (pages > remaining) return { ok: false, message: `今日仅剩 ${remaining} 页可打卡` }
    if (pages > state.calcConfig.perSubmit) {
      return { ok: false, message: `单次最多提交 ${state.calcConfig.perSubmit} 页` }
    }
    if (!images || images.length !== pages) return { ok: false, message: '请上传计算作业图片' }

    const passed = review === 'passed'
    const neat = passed && !!neatBonus
    const perPagePoints = state.calcConfig.pointsPerPage ?? POINTS.calcPerPage
    const neatPoints = state.calcConfig.neatBonus ?? POINTS.neatBonus
    const earned = pages * perPagePoints + (neat ? neatPoints : 0)
    const draft = structuredClone(state)
    const record = {
      id: uid('cc'),
      userId: user.id,
      date: today,
      pages,
      images,
      review,
      neatBonus: neat ? neatPoints : 0,
      accuracy: accuracy || null,
      points: earned,
      createdAt: nowISO(),
    }
    draft.calcCheckins.unshift(record)
    addPoints(draft, user.id, pages * perPagePoints, 'calc', '计算打卡', record.id)
    if (neat) addPoints(draft, user.id, neatPoints, 'handwriting', '字迹奖励', record.id)
    const unlocks = recomputeProgress(draft, user.id)
    setState(draft)
    notifyUnlocks(unlocks)
    return { ok: true, points: earned, record, passed, unlocks }
  }

  // ---------- gifts & orders ----------
  const redeemVirtual = (giftId) => {
    if (!user) return { ok: false, message: '请先登录' }
    const gift = state.gifts.find((g) => g.id === giftId)
    if (!gift) return { ok: false, message: '礼品不存在' }
    const unlocks = state.unlocks[user.id]
    if (!isGiftUnlocked(gift, user, unlocks, state.ladders)) {
      return { ok: false, message: '尚未满足该礼品的解锁条件' }
    }
    if (user.points < gift.cost) return { ok: false, message: `积分不足，还需 ${gift.cost - user.points} 积分` }
    if (user.ownedAvatars?.includes(gift.id)) return { ok: false, message: '该装扮已拥有，无需重复兑换' }
    const draft = structuredClone(state)
    const me = draft.users.find((u) => u.id === user.id)
    me.ownedAvatars = [...(me.ownedAvatars || []), gift.id]
    if (gift.avatar) me.avatar = gift.image
    const order = {
      id: uid('od'),
      userId: user.id,
      giftId: gift.id,
      giftName: gift.name,
      giftType: 'virtual',
      cost: gift.cost,
      status: '已发放',
      createdAt: nowISO(),
      reviewedAt: nowISO(),
      completedAt: nowISO(),
      remark: '系统自动发放',
    }
    draft.orders.unshift(order)
    addPoints(draft, user.id, -gift.cost, 'virtual_redeem', `兑换 ${gift.name}`, order.id)
    setState(draft)
    return { ok: true, order, points: gift.cost }
  }

  const redeemPhysical = (giftId, addressId, customData) => {
    if (!user) return { ok: false, message: '请先登录' }
    const gift = state.gifts.find((g) => g.id === giftId)
    if (!gift) return { ok: false, message: '礼品不存在' }
    const unlocks = state.unlocks[user.id]
    if (!isGiftUnlocked(gift, user, unlocks, state.ladders)) {
      return { ok: false, message: '尚未满足该礼品的解锁条件' }
    }
    if (!addressId) return { ok: false, message: '请先选择收货地址' }
    const address = state.addresses.find((a) => a.id === addressId && a.userId === user.id)
    if (!address) return { ok: false, message: '收货地址不存在，请重新选择' }
    if (user.points < gift.cost) return { ok: false, message: `积分不足，还需 ${gift.cost - user.points} 积分` }
    if (gift.stock !== null && gift.stock <= 0) return { ok: false, message: '礼品库存不足，暂无法兑换' }

    let custom = null
    if (gift.custom) {
      if (!customData?.name || !customData.name.trim()) return { ok: false, message: '请填写商品名称' }
      const price = Number(customData.price)
      if (!Number.isFinite(price) || price <= 0) return { ok: false, message: '请填写正确的商品价格' }
      if (price > 100) return { ok: false, message: '超出预算，商品价格需在 100 元以内' }
      if (!customData.screenshotMediaId) return { ok: false, message: '请上传商品截图' }
      custom = {
        name: customData.name.trim(),
        price,
        screenshotMediaId: customData.screenshotMediaId,
        link: (customData.link || '').trim(),
      }
    }

    const draft = structuredClone(state)
    const me = draft.users.find((u) => u.id === user.id)
    const giftDraft = draft.gifts.find((g) => g.id === gift.id)
    if (giftDraft.stock !== null) giftDraft.stock = Math.max(0, giftDraft.stock - 1)
    const orderId = uid('od')
    const order = {
      id: orderId,
      userId: user.id,
      giftId: gift.id,
      giftName: gift.custom ? `自选商品 · ${custom.name}` : gift.name,
      giftType: 'physical',
      cost: gift.cost,
      status: '待审核',
      createdAt: nowISO(),
      reviewedAt: null,
      completedAt: null,
      remark: '',
      address: { ...address },
      isCustom: !!gift.custom,
      customItemId: null,
      logisticsId: null,
    }
    if (custom) {
      const customItem = {
        id: uid('ci'),
        orderId,
        userId: user.id,
        ...custom,
        status: '待审核',
        createdAt: nowISO(),
      }
      draft.customItems.unshift(customItem)
      order.customItemId = customItem.id
    }
    draft.orders.unshift(order)
    addPoints(draft, user.id, -gift.cost, 'physical_redeem', gift.custom ? '自选商品兑换申请' : `兑换 ${gift.name}`, orderId)
    setState(draft)
    return { ok: true, order }
  }

  const reviewOrder = (orderId, approved, remark = '') => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限执行该操作' }
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return { ok: false, message: '订单不存在' }
    if (order.status !== '待审核') return { ok: false, message: '该订单已处理' }
    const draft = structuredClone(state)
    const target = draft.orders.find((o) => o.id === orderId)
    const time = nowISO()
    if (!approved) {
      target.status = '已驳回'
      target.reviewedAt = time
      target.remark = remark || '不符合兑换条件'
      const customer = draft.users.find((u) => u.id === target.userId)
      if (customer) customer.points += target.cost
      addPoints(draft, target.userId, target.cost, 'refund', '审核驳回退还积分', target.id)
      const gift = draft.gifts.find((g) => g.id === target.giftId)
      if (gift && gift.stock !== null) gift.stock += 1
      const ci = draft.customItems.find((c) => c.orderId === orderId)
      if (ci) ci.status = '已驳回'
      setState(draft)
      return { ok: true }
    }
    target.status = '已发货'
    target.reviewedAt = time
    target.remark = remark || '审核通过，已安排发货'
    const gift = draft.gifts.find((g) => g.id === target.giftId)
    const logistics = {
      id: uid('lg'),
      orderId,
      company: '顺丰速运',
      trackingNo: `SF${Date.now().toString().slice(-12)}`,
      status: '已发货',
      latest: '商家已发货，等待快递揽收',
      updatedAt: time,
      traces: [{ time, text: '订单审核通过，商家已安排发货' }],
    }
    draft.logistics.unshift(logistics)
    target.logisticsId = logistics.id
    const ci = draft.customItems.find((c) => c.orderId === orderId)
    if (ci) ci.status = '已通过'
    if (gift && gift.custom) {
      // 自选商品不占常规库存
    }
    setState(draft)
    return { ok: true }
  }

  const completeOrder = (orderId) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限执行该操作' }
    const order = state.orders.find((o) => o.id === orderId)
    if (!order || order.status !== '已发货') return { ok: false, message: '当前订单不可标记完成' }
    const draft = structuredClone(state)
    const target = draft.orders.find((o) => o.id === orderId)
    target.status = '已完成'
    target.completedAt = nowISO()
    const lg = draft.logistics.find((l) => l.id === target.logisticsId)
    if (lg) {
      lg.status = '已签收'
      lg.latest = '快件已签收，感谢使用学习打卡'
      lg.updatedAt = nowISO()
      lg.traces.unshift({ time: nowISO(), text: '快件已签收，感谢使用学习打卡' })
    }
    setState(draft)
    return { ok: true }
  }

  // ---------- addresses ----------
  const saveAddress = (payload, id) => {
    if (!user) return { ok: false, message: '请先登录' }
    if (!payload.name?.trim()) return { ok: false, message: '请填写收货人' }
    if (!/^1\d{10}$/.test(payload.phone || '')) return { ok: false, message: '请填写正确的手机号' }
    if (!payload.province?.trim() || !payload.city?.trim() || !payload.district?.trim()) {
      return { ok: false, message: '请填写完整的省市区' }
    }
    if (!payload.detail?.trim()) return { ok: false, message: '请填写详细地址' }
    const draft = structuredClone(state)
    const mine = draft.addresses.filter((a) => a.userId === user.id)
    let isDefault = payload.isDefault || mine.length === 0
    if (isDefault) {
      draft.addresses.forEach((a) => {
        if (a.userId === user.id) a.isDefault = false
      })
    }
    if (id) {
      const target = draft.addresses.find((a) => a.id === id && a.userId === user.id)
      if (!target) return { ok: false, message: '地址不存在' }
      Object.assign(target, {
        name: payload.name.trim(),
        phone: payload.phone,
        province: payload.province.trim(),
        city: payload.city.trim(),
        district: payload.district.trim(),
        detail: payload.detail.trim(),
        isDefault,
      })
    } else {
      draft.addresses.push({
        id: uid('addr'),
        userId: user.id,
        name: payload.name.trim(),
        phone: payload.phone,
        province: payload.province.trim(),
        city: payload.city.trim(),
        district: payload.district.trim(),
        detail: payload.detail.trim(),
        isDefault,
      })
    }
    setState(draft)
    return { ok: true }
  }

  const deleteAddress = (id) => {
    if (!user) return { ok: false, message: '请先登录' }
    const draft = structuredClone(state)
    const target = draft.addresses.find((a) => a.id === id && a.userId === user.id)
    if (!target) return { ok: false, message: '地址不存在' }
    draft.addresses = draft.addresses.filter((a) => a.id !== id)
    if (target.isDefault) {
      const rest = draft.addresses.filter((a) => a.userId === user.id)
      if (rest.length) rest[0].isDefault = true
    }
    setState(draft)
    return { ok: true }
  }

  const setDefaultAddress = (id) => {
    if (!user) return { ok: false, message: '请先登录' }
    const draft = structuredClone(state)
    draft.addresses.forEach((a) => {
      if (a.userId === user.id) a.isDefault = a.id === id
    })
    setState(draft)
    return { ok: true }
  }

  // ---------- admin configs ----------
  const saveReadingConfig = ({ minMinutes, points }) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限修改规则' }
    if (!isIntInRange(minMinutes, 1, 600)) return { ok: false, message: '最少时长需为 1-600 的正整数' }
    if (!isIntInRange(points, 0, 1000)) return { ok: false, message: '每次打卡积分需为 0-1000 的整数' }
    const draft = structuredClone(state)
    draft.readingConfig = {
      minMinutes: Number(minMinutes),
      points: Number(points),
      updatedAt: nowISO(),
    }
    setState(draft)
    return { ok: true }
  }

  const saveCalcConfig = ({ dailyLimit, perSubmit, pointsPerPage, neatBonus }) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限修改规则' }
    if (!isIntInRange(dailyLimit, 1, 100)) return { ok: false, message: '每日上限需为 1-100 的正整数' }
    if (!isIntInRange(perSubmit, 1, 50)) return { ok: false, message: '单次页数需为 1-50 的正整数' }
    if (Number(perSubmit) > Number(dailyLimit)) return { ok: false, message: '单次提交页数不得大于每日上限' }
    if (!isIntInRange(pointsPerPage, 0, 1000)) return { ok: false, message: '每页基础积分需为 0-1000 的整数' }
    if (!isIntInRange(neatBonus, 0, 1000)) return { ok: false, message: '字迹工整奖励需为 0-1000 的整数' }
    const draft = structuredClone(state)
    draft.calcConfig = {
      dailyLimit: Number(dailyLimit),
      perSubmit: Number(perSubmit),
      pointsPerPage: Number(pointsPerPage),
      neatBonus: Number(neatBonus),
      updatedAt: nowISO(),
    }
    setState(draft)
    return { ok: true }
  }

  const saveHomeworkConfig = (payload) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限修改规则' }
    const error = validateHomeworkForm(payload)
    if (error) return { ok: false, message: error }
    const draft = structuredClone(state)
    draft.homeworkConfig = {
      totalPages: Number(payload.totalPages),
      mode: payload.mode,
      dailyPages: payload.mode === 'daily' ? Number(payload.dailyPages) : draft.homeworkConfig.dailyPages,
      stages:
        payload.mode === 'stages'
          ? payload.stages.map((s, idx) => ({
              id: s.id || uid('hs'),
              name: s.name.trim(),
              pages: Number(s.pages),
              order: idx + 1,
            }))
          : [],
      updatedAt: nowISO(),
    }
    const affected = new Set(draft.users.map((u) => u.id))
    affected.forEach((id) => recomputeProgress(draft, id))
    setState(draft)
    return { ok: true }
  }

  const saveLadder = (form, id) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限修改规则' }
    const error = validateLadderForm(form)
    if (error) return { ok: false, message: error }
    const duplicated = state.ladders.some((l) => l.days === Number(form.days) && l.id !== id)
    if (duplicated) return { ok: false, message: '已存在相同天数的阶梯目标' }
    const draft = structuredClone(state)
    if (id) {
      const target = draft.ladders.find((l) => l.id === id)
      if (!target) return { ok: false, message: '阶梯目标不存在' }
      Object.assign(target, {
        days: Number(form.days),
        name: form.name.trim(),
        desc: (form.desc || '').trim(),
        giftId: form.giftId || null,
        updatedAt: nowISO(),
      })
    } else {
      draft.ladders.push({
        id: uid('l'),
        days: Number(form.days),
        name: form.name.trim(),
        desc: (form.desc || '').trim(),
        giftId: form.giftId || null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        status: '启用',
      })
    }
    ;[...draft.users].forEach((u) => {
      if (u.role === 'student') recomputeProgress(draft, u.id)
    })
    setState(draft)
    return { ok: true }
  }

  const deleteLadder = (id) => {
    if (!user || user.role !== 'admin') return { ok: false, message: '无权限修改规则' }
    const draft = structuredClone(state)
    draft.ladders = draft.ladders.filter((l) => l.id !== id)
    setState(draft)
    return { ok: true }
  }

  const resetDemo = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      await clearMedia()
    } catch {
      // ignore
    }
    const seeded = createSeedState()
    setState(seeded)
  }

  const today = todayKey()
  const todayReading = user ? state.readingCheckins.find((r) => r.userId === user.id && r.date === today) : null
  const todayCalc = user ? state.calcCheckins.filter((c) => c.userId === user.id && c.date === today) : []
  const calcPagesToday = todayCalc.reduce((s, c) => s + (c.pages || 1), 0)

  const value = {
    state,
    user,
    toasts,
    celebration,
    dismissToast,
    dismissCelebration,
    toast,
    sendCode,
    loginWithCode,
    loginWithPassword,
    register,
    logout,
    completeReading,
    completeCalc,
    redeemVirtual,
    redeemPhysical,
    reviewOrder,
    completeOrder,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    saveReadingConfig,
    saveCalcConfig,
    saveHomeworkConfig,
    saveLadder,
    deleteLadder,
    resetDemo,
    todayReading,
    todayCalc,
    calcPagesToday,
    dateKey,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
