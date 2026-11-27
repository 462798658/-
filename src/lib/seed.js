import {
  ADMIN_ACCOUNT,
  ADMIN_PASSWORD,
  DEMO_ACCOUNT,
  DEMO_PASSWORD,
  DEMO_PHONE,
  makeDefaultCalcConfig,
  makeDefaultExtraConfig,
  makeDefaultGifts,
  makeDefaultHomeworkConfig,
  makeDefaultLadders,
  makeDefaultReadingConfig,
  POINTS,
} from './domain'
import { parseKey, shiftKey, todayKey, uid } from './utils'

const isoAt = (key, h, m = 0) => {
  const d = parseKey(key)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const STORAGE_KEY = 'study_checkin_state_v1'

export function createSeedState() {
  const today = todayKey()
  const gifts = makeDefaultGifts()
  const ladders = makeDefaultLadders()
  const demoId = 'u_demo'
  const adminId = 'u_admin'

  const readingCheckins = []
  const calcCheckins = []
  const events = []
  const HISTORY_DAYS = 36

  for (let i = HISTORY_DAYS; i >= 1; i -= 1) {
    const day = shiftKey(today, -i)
    const readingId = uid('rd')
    readingCheckins.push({
      id: readingId,
      userId: demoId,
      date: day,
      durationSec: 1800 + (i % 7) * 95,
      mediaId: null,
      mode: 'watch',
      points: POINTS.reading,
      createdAt: isoAt(day, 19, 30),
    })
    events.push({
      ts: isoAt(day, 19, 30),
      type: 'reading',
      label: '阅读打卡',
      points: POINTS.reading,
      refId: readingId,
    })

    const neat = i % 3 !== 0
    const calcId = uid('cc')
    calcCheckins.push({
      id: calcId,
      userId: demoId,
      date: day,
      pages: 2,
      images: [],
      review: 'passed',
      neatBonus: neat ? POINTS.neatBonus : 0,
      accuracy: 82 + (i % 15),
      points: 2 * POINTS.calcPerPage + (neat ? POINTS.neatBonus : 0),
      createdAt: isoAt(day, 20, 0),
    })
    events.push({
      ts: isoAt(day, 20, 0),
      type: 'calc',
      label: '计算打卡',
      points: 2 * POINTS.calcPerPage,
      refId: calcId,
    })
    if (neat) {
      events.push({
        ts: isoAt(day, 20, 5),
        type: 'handwriting',
        label: '字迹奖励',
        points: POINTS.neatBonus,
        refId: calcId,
      })
    }
  }

  const addressId = 'addr_demo'
  const addresses = [
    {
      id: addressId,
      userId: demoId,
      name: '陈小满',
      phone: DEMO_PHONE,
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '文三路 88 号 3 幢 502 室',
      isDefault: true,
    },
  ]

  const astroGift = gifts.find((g) => g.id === 'g_astro')
  const notebook = gifts.find((g) => g.id === 'g_notebook')
  notebook.stock -= 1

  const virtualOrderId = uid('od')
  const physicalOrderId = uid('od')
  const orders = [
    {
      id: virtualOrderId,
      userId: demoId,
      giftId: astroGift.id,
      giftName: astroGift.name,
      giftType: 'virtual',
      cost: astroGift.cost,
      status: '已发放',
      createdAt: isoAt(shiftKey(today, -11), 21, 10),
      reviewedAt: isoAt(shiftKey(today, -11), 21, 12),
      completedAt: isoAt(shiftKey(today, -11), 21, 12),
      remark: '虚拟礼品已自动发放',
    },
    {
      id: physicalOrderId,
      userId: demoId,
      giftId: notebook.id,
      giftName: notebook.name,
      giftType: 'physical',
      cost: notebook.cost,
      status: '已发货',
      createdAt: isoAt(shiftKey(today, -2), 21, 30),
      reviewedAt: isoAt(shiftKey(today, -2), 21, 45),
      completedAt: null,
      remark: '',
      address: addresses[0],
      logisticsId: 'lg_demo',
    },
  ]

  events.push({
    ts: isoAt(shiftKey(today, -11), 21, 10),
    type: 'virtual_redeem',
    label: '兑换虚拟礼品',
    points: -astroGift.cost,
    refId: virtualOrderId,
  })
  events.push({
    ts: isoAt(shiftKey(today, -2), 21, 30),
    type: 'physical_redeem',
    label: '兑换实物礼品',
    points: -notebook.cost,
    refId: physicalOrderId,
  })

  events.sort((a, b) => new Date(a.ts) - new Date(b.ts))

  let balance = 0
  const pointsLogs = events.map((e) => {
    balance += e.points
    return {
      id: uid('pl'),
      userId: demoId,
      type: e.type,
      label: e.label,
      points: e.points,
      balanceAfter: balance,
      refId: e.refId,
      createdAt: e.ts,
    }
  })

  const logistics = [
    {
      id: 'lg_demo',
      orderId: physicalOrderId,
      company: '顺丰速运',
      trackingNo: 'SF1234567890123',
      status: '运输中',
      latest: '快递员正在派送，请保持电话畅通',
      updatedAt: isoAt(shiftKey(today, -1), 9, 5),
      traces: [
        { time: isoAt(shiftKey(today, -1), 9, 5), text: '快件已到达【杭州西湖营业点】，快递员正在派送' },
        { time: isoAt(shiftKey(today, -1), 8, 20), text: '快件已到达【杭州西湖营业点】' },
        { time: isoAt(shiftKey(today, -2), 23, 10), text: '快件已发往【杭州中转场】' },
        { time: isoAt(shiftKey(today, -2), 21, 45), text: '顺丰速运已收取快件' },
      ],
    },
  ]

  const users = [
    {
      id: adminId,
      account: ADMIN_ACCOUNT,
      password: ADMIN_PASSWORD,
      nickname: '李老师',
      avatar: null,
      avatarMediaId: null,
      role: 'admin',
      points: 0,
      streakDays: 0,
      totalDays: 0,
      daysAdjust: 0,
      totalPages: 0,
      lastCheckinDate: null,
      createdAt: isoAt(shiftKey(today, -120), 9, 0),
      ownedAvatars: [],
    },
    {
      id: demoId,
      account: DEMO_ACCOUNT,
      password: DEMO_PASSWORD,
      nickname: '陈小满',
      avatar: astroGift.image,
      avatarMediaId: null,
      role: 'student',
      points: balance,
      streakDays: HISTORY_DAYS,
      totalDays: HISTORY_DAYS,
      daysAdjust: 0,
      totalPages: HISTORY_DAYS * 2,
      lastCheckinDate: shiftKey(today, -1),
      createdAt: isoAt(shiftKey(today, -40), 9, 0),
      ownedAvatars: [astroGift.id],
    },
  ]

  const unlocks = {
    [demoId]: {
      ladders: [
        { ...ladders[0], unlockedAt: isoAt(shiftKey(today, -29), 20, 10) },
        { ...ladders[1], unlockedAt: isoAt(shiftKey(today, -15), 20, 10) },
        { ...ladders[2], unlockedAt: isoAt(shiftKey(today, -6), 20, 10) },
      ],
      stages: [
        {
          stageId: 'hs_1',
          name: '初阶目标',
          pages: 50,
          threshold: 50,
          unlockedAt: isoAt(shiftKey(today, -18), 20, 10),
        },
      ],
    },
  }

  return {
    version: 1,
    session: null,
    users,
    readingCheckins,
    calcCheckins,
    pointsLogs,
    gifts,
    ladders,
    homeworkConfig: makeDefaultHomeworkConfig(),
    readingConfig: makeDefaultReadingConfig(),
    calcConfig: makeDefaultCalcConfig(),
    extraConfig: makeDefaultExtraConfig(),
    extraCheckins: [],
    extraClaims: [],
    orders,
    customItems: [],
    addresses,
    logistics,
    unlocks,
    adjustLogs: [],
  }
}
