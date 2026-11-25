import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Gift,
  ImagePlus,
  Layers,
  LockKeyhole,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Target,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, Field, GiftImage, ImageWithFallback, MediaImage, Modal, PageHeader, Sheet } from '../components/ui'
import { giftUnlockText } from '../lib/domain'
import { formatDateTime, uid } from '../lib/utils'

const TABS = [
  { value: 'ladder', label: '打卡阶梯' },
  { value: 'homework', label: '作业打卡' },
  { value: 'reading', label: '阅读打卡' },
  { value: 'calc', label: '计算打卡' },
  { value: 'gift', label: '礼品管理' },
  { value: 'review', label: '兑换审核' },
]

const emptyLadder = { days: '', name: '', desc: '', giftId: '' }
const emptyGift = {
  name: '',
  type: 'physical',
  cost: '',
  stock: '10',
  budget: '',
  avatar: false,
  image: '',
  imageMediaId: null,
  desc: '',
  unlock: { type: 'none', value: '' },
}

export default function Admin() {
  const {
    state,
    user,
    saveLadder,
    deleteLadder,
    saveGift,
    setGiftShelf,
    deleteGift,
    saveHomeworkConfig,
    saveReadingConfig,
    saveCalcConfig,
    reviewOrder,
    completeOrder,
    toast,
  } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('ladder')

  const [ladderOpen, setLadderOpen] = useState(false)
  const [editingLadder, setEditingLadder] = useState(null)
  const [ladderForm, setLadderForm] = useState(emptyLadder)
  const [ladderError, setLadderError] = useState('')
  const [deleteLadderId, setDeleteLadderId] = useState(null)

  const [giftOpen, setGiftOpen] = useState(false)
  const [editingGift, setEditingGift] = useState(null)
  const [giftForm, setGiftForm] = useState(emptyGift)
  const [giftError, setGiftError] = useState('')
  const [giftImageFile, setGiftImageFile] = useState(null)
  const [giftImagePreviewUrl, setGiftImagePreviewUrl] = useState('')
  const [giftSaving, setGiftSaving] = useState(false)
  const giftAlbumRef = useRef(null)
  const giftCameraRef = useRef(null)
  const [deleteGiftId, setDeleteGiftId] = useState(null)

  const [homework, setHomework] = useState(() => ({
    totalPages: String(state.homeworkConfig.totalPages),
    mode: state.homeworkConfig.mode,
    dailyPages: String(state.homeworkConfig.dailyPages),
    stages: state.homeworkConfig.stages.map((s) => ({ ...s, pages: String(s.pages) })),
  }))
  const [hwError, setHwError] = useState('')
  const [pendingMode, setPendingMode] = useState(null)

  const [readingForm, setReadingForm] = useState({
    minMinutes: String(state.readingConfig.minMinutes),
    points: String(state.readingConfig.points),
  })
  const [readingError, setReadingError] = useState('')

  const [calcForm, setCalcForm] = useState({
    dailyLimit: String(state.calcConfig.dailyLimit),
    perSubmit: String(state.calcConfig.perSubmit),
    pointsPerPage: String(state.calcConfig.pointsPerPage),
    neatBonus: String(state.calcConfig.neatBonus),
  })
  const [calcError, setCalcError] = useState('')

  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectRemark, setRejectRemark] = useState('')
  const [seenOrderId, setSeenOrderId] = useState(null)

  useEffect(
    () => () => {
      if (giftImagePreviewUrl) URL.revokeObjectURL(giftImagePreviewUrl)
    },
    [giftImagePreviewUrl],
  )

  if (!user || user.role !== 'admin') {
    return (
      <div>
        <PageHeader title="规则配置中心" />
        <div className="no-permission">
          <div className="no-permission-icon">
            <LockKeyhole size={30} />
          </div>
          <h2>无权限访问</h2>
          <p>规则配置中心仅管理员可见，普通学员无法进入。</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const gifts = state.gifts
  const sortedLadders = [...state.ladders].sort((a, b) => a.days - b.days)
  const pendingOrders = state.orders.filter((o) => o.status === '待审核')
  const shippedOrders = state.orders.filter((o) => o.status === '已发货')
  const deletingGift = gifts.find((g) => g.id === deleteGiftId) || null
  const deletingGiftRefs = deletingGift
    ? [
        state.orders.some((o) => o.giftId === deletingGift.id) ? '兑换订单' : null,
        state.ladders.some((l) => l.giftId === deletingGift.id) ? '打卡阶梯' : null,
        state.users.some((u) => u.ownedAvatars?.includes(deletingGift.id)) ? '学员虚拟权益' : null,
      ].filter(Boolean)
    : []

  const openLadderNew = () => {
    setEditingLadder(null)
    setLadderForm(emptyLadder)
    setLadderError('')
    setLadderOpen(true)
  }

  const openLadderEdit = (ladder) => {
    setEditingLadder(ladder)
    setLadderForm({
      days: String(ladder.days),
      name: ladder.name,
      desc: ladder.desc || '',
      giftId: ladder.giftId || '',
    })
    setLadderError('')
    setLadderOpen(true)
  }

  const submitLadder = () => {
    const res = saveLadder(ladderForm, editingLadder?.id)
    if (!res.ok) {
      setLadderError(res.message)
      return
    }
    toast(editingLadder ? '阶梯目标已更新并实时同步' : '阶梯目标已新增并实时同步', 'success')
    setLadderOpen(false)
  }

  const confirmDeleteLadder = () => {
    const res = deleteLadder(deleteLadderId)
    if (!res.ok) toast(res.message, 'error')
    else toast('阶梯目标已删除，已解锁学员的奖励保持不变', 'success')
    setDeleteLadderId(null)
  }

  const resetGiftImageDraft = () => {
    setGiftImageFile(null)
    setGiftImagePreviewUrl('')
    if (giftAlbumRef.current) giftAlbumRef.current.value = ''
    if (giftCameraRef.current) giftCameraRef.current.value = ''
  }

  const closeGift = () => {
    if (giftSaving) return
    resetGiftImageDraft()
    setGiftOpen(false)
  }

  const handleGiftImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setGiftError('请选择图片文件')
      return
    }
    setGiftError('')
    setGiftImageFile(file)
    setGiftImagePreviewUrl(URL.createObjectURL(file))
  }

  const openGiftNew = () => {
    resetGiftImageDraft()
    setEditingGift(null)
    setGiftForm({ ...emptyGift, unlock: { ...emptyGift.unlock } })
    setGiftError('')
    setGiftOpen(true)
  }

  const openGiftEdit = (gift) => {
    resetGiftImageDraft()
    setEditingGift(gift)
    setGiftForm({
      name: gift.name,
      type: gift.type,
      cost: String(gift.cost),
      stock: gift.stock === null ? '' : String(gift.stock),
      budget: gift.budget === null || gift.budget === undefined ? '' : String(gift.budget),
      avatar: !!gift.avatar,
      image: gift.image || '',
      imageMediaId: gift.imageMediaId || null,
      desc: gift.desc || '',
      unlock: {
        type: gift.unlock?.type || 'none',
        value: gift.unlock?.value ? String(gift.unlock.value) : '',
      },
    })
    setGiftError('')
    setGiftOpen(true)
  }

  const updateGift = (key, value) => setGiftForm((g) => ({ ...g, [key]: value }))
  const updateGiftUnlock = (key, value) => {
    setGiftForm((g) => ({ ...g, unlock: { ...g.unlock, [key]: value } }))
  }

  const submitGift = async () => {
    if (giftSaving) return
    setGiftSaving(true)
    setGiftError('')
    try {
      const res = await saveGift(giftForm, editingGift?.id, giftImageFile)
      if (!res.ok) {
        setGiftError(res.message)
        return
      }
      toast(editingGift ? '礼品信息已更新并同步至商城' : '礼品已新增并默认上架', 'success')
      resetGiftImageDraft()
      setGiftOpen(false)
    } catch {
      setGiftError('保存失败，请重试')
    } finally {
      setGiftSaving(false)
    }
  }

  const handleGiftShelf = (gift, isOnShelf) => {
    const res = setGiftShelf(gift.id, isOnShelf)
    if (!res.ok) {
      toast(res.message, 'error')
      return false
    }
    toast(isOnShelf ? `「${gift.name}」已上架` : `「${gift.name}」已下架，商城不再展示`, 'success')
    return true
  }

  const confirmDeleteGift = () => {
    const res = deleteGift(deleteGiftId)
    if (!res.ok) {
      toast(res.message, 'error')
      return
    }
    toast('礼品已删除', 'success')
    setDeleteGiftId(null)
  }

  const applyMode = (mode) => {
    setHomework((h) => ({
      ...h,
      mode,
      dailyPages: mode === 'daily' ? h.dailyPages : '',
      stages: mode === 'stages' ? h.stages : [],
    }))
    setPendingMode(null)
    setHwError('')
  }

  const requestMode = (mode) => {
    if (mode === homework.mode) return
    const hasContent = homework.mode === 'daily' ? !!homework.dailyPages : homework.stages.length > 0
    if (hasContent) setPendingMode(mode)
    else applyMode(mode)
  }

  const addStage = () => {
    setHomework((h) => ({
      ...h,
      stages: [...h.stages, { id: uid('hs'), name: '', pages: '' }],
    }))
  }

  const updateStage = (id, key, value) => {
    setHomework((h) => ({
      ...h,
      stages: h.stages.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    }))
  }

  const removeStage = (id) => {
    setHomework((h) => ({ ...h, stages: h.stages.filter((s) => s.id !== id) }))
  }

  const submitHomework = () => {
    const res = saveHomeworkConfig({
      totalPages: homework.totalPages,
      mode: homework.mode,
      dailyPages: homework.dailyPages,
      stages: homework.stages,
    })
    if (!res.ok) {
      setHwError(res.message)
      toast(res.message, 'error')
      return
    }
    setHwError('')
    toast('作业打卡配置已保存并实时同步', 'success')
  }

  const submitReading = () => {
    const res = saveReadingConfig(readingForm)
    if (!res.ok) {
      setReadingError(res.message)
      return
    }
    setReadingError('')
    toast(`阅读规则已保存：每次打卡 +${readingForm.points} 积分，学员端实时生效`, 'success')
  }

  const submitCalc = () => {
    const res = saveCalcConfig(calcForm)
    if (!res.ok) {
      setCalcError(res.message)
      return
    }
    setCalcError('')
    toast('计算打卡配置已保存，学员端实时生效', 'success')
  }

  const handleApprove = (order) => {
    const res = reviewOrder(order.id, true)
    if (!res.ok) toast(res.message, 'error')
    else toast('已通过审核并生成物流单', 'success')
  }

  const handleReject = () => {
    const res = reviewOrder(rejectTarget.id, false, rejectRemark.trim())
    if (!res.ok) toast(res.message, 'error')
    else toast('已驳回订单并退还积分', 'success')
    setRejectTarget(null)
    setRejectRemark('')
  }

  const handleComplete = (order) => {
    const res = completeOrder(order.id)
    if (!res.ok) toast(res.message, 'error')
    else toast('订单已标记为完成', 'success')
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="规则配置中心"
        subtitle="仅管理员可见 · 保存后实时同步至学员端"
        right={<Badge tone="amber"><ShieldCheck size={12} /> 管理员</Badge>}
      />

      <div className="admin-sync">
        <RefreshCcw size={14} />
        <span>所有配置项保存后立即生效，学员端规则说明与打卡校验实时更新</span>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.value} className={tab === t.value ? 'active' : ''} onClick={() => setTab(t.value)}>
            {t.label}
            {t.value === 'review' && pendingOrders.length > 0 ? <i>{pendingOrders.length}</i> : null}
          </button>
        ))}
      </div>

      {tab === 'ladder' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>打卡阶梯设置</h2>
              <p>按累计打卡天数升序展示，学员达成后解锁对应奖励</p>
            </div>
            <button className="mini-btn" onClick={openLadderNew}>
              <Plus size={14} /> 新增
            </button>
          </div>

          <div className="ladder-admin-list">
            {sortedLadders.map((l) => {
              const gift = gifts.find((g) => g.id === l.giftId)
              return (
                <div key={l.id} className="ladder-admin-row">
                  <span className="ladder-admin-days">
                    {l.days}
                    <i>天</i>
                  </span>
                  <div className="ladder-admin-main">
                    <b>{l.name}</b>
                    {l.desc ? <p>{l.desc}</p> : null}
                    <span className="ladder-admin-gift">
                      <Gift size={12} /> {gift ? `关联礼品：${gift.name}` : '未关联礼品'}
                    </span>
                  </div>
                  <div className="ladder-admin-actions">
                    <button className="icon-btn small" onClick={() => openLadderEdit(l)} aria-label="编辑">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn small danger" onClick={() => setDeleteLadderId(l.id)} aria-label="删除">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
            {sortedLadders.length === 0 ? <p className="admin-empty">暂未配置阶梯目标，点击右上角新增。</p> : null}
          </div>

          <div className="admin-tip">
            <AlertTriangle size={14} />
            删除已被学员解锁的阶梯目标时，已解锁学员保留奖励，新学员不再解锁该阶梯。
          </div>
        </div>
      ) : null}

      {tab === 'homework' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>作业打卡设置</h2>
              <p>设置累计页数目标，并选择目标分解方式</p>
            </div>
          </div>

          <Field label="累计总页数目标" hint="正整数，范围 1-10000">
            <input
              type="number"
              min="1"
              max="10000"
              value={homework.totalPages}
              onChange={(e) => setHomework((h) => ({ ...h, totalPages: e.target.value }))}
            />
          </Field>

          <div className="mode-cards">
            <button
              className={`mode-card ${homework.mode === 'daily' ? 'active' : ''}`}
              onClick={() => requestMode('daily')}
            >
              <span className="mode-card-icon">
                <Target size={18} />
              </span>
              <b>按每日目标</b>
              <p>设定每天需完成的页数</p>
              {homework.mode === 'daily' ? <Check size={16} className="mode-check" /> : null}
            </button>
            <button
              className={`mode-card ${homework.mode === 'stages' ? 'active' : ''}`}
              onClick={() => requestMode('stages')}
            >
              <span className="mode-card-icon">
                <Layers size={18} />
              </span>
              <b>按任务阶段</b>
              <p>拆分为多个阶段目标</p>
              {homework.mode === 'stages' ? <Check size={16} className="mode-check" /> : null}
            </button>
          </div>

          {homework.mode === 'daily' ? (
            <Field label="每日目标页数" hint="正整数，范围 1-100">
              <input
                type="number"
                min="1"
                max="100"
                placeholder="例如 10"
                value={homework.dailyPages}
                onChange={(e) => setHomework((h) => ({ ...h, dailyPages: e.target.value }))}
              />
            </Field>
          ) : (
            <div className="stage-editor">
              <div className="stage-editor-head">
                <span>任务阶段</span>
                <button className="text-btn" onClick={addStage}>
                  <Plus size={14} /> 添加阶段
                </button>
              </div>
              {homework.stages.map((s, idx) => (
                <div key={s.id} className="stage-row">
                  <span className="stage-index">{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="阶段名称"
                    maxLength={20}
                    value={s.name}
                    onChange={(e) => updateStage(s.id, 'name', e.target.value)}
                  />
                  <input
                    className="stage-pages"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="页数"
                    value={s.pages}
                    onChange={(e) => updateStage(s.id, 'pages', e.target.value)}
                  />
                  <button className="icon-btn small danger" onClick={() => removeStage(s.id)} aria-label="删除阶段">
                    <X size={15} />
                  </button>
                </div>
              ))}
              {homework.stages.length === 0 ? <p className="admin-empty">请至少添加一个任务阶段。</p> : null}
            </div>
          )}

          {hwError ? <p className="form-error">{hwError}</p> : null}
          <button className="btn btn-primary full" onClick={submitHomework}>
            保存作业打卡配置
          </button>
        </div>
      ) : null}

      {tab === 'reading' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>阅读打卡设置</h2>
              <p>设置最少学习时长与每次打卡的积分奖励</p>
            </div>
          </div>
          <Field label="单次最少时长（分钟）" hint="正整数，范围 1-600，保存后倒计时与提交校验实时更新">
            <input
              type="number"
              min="1"
              max="600"
              value={readingForm.minMinutes}
              onChange={(e) => setReadingForm((r) => ({ ...r, minMinutes: e.target.value }))}
            />
          </Field>
          <Field label="每次打卡积分奖励" hint="整数，范围 0-1000；设为 0 可关闭阅读积分奖励">
            <input
              type="number"
              min="0"
              max="1000"
              value={readingForm.points}
              onChange={(e) => setReadingForm((r) => ({ ...r, points: e.target.value }))}
            />
          </Field>
          {readingError ? <p className="form-error">{readingError}</p> : null}
          <div className="admin-preview">
            <BookOpen size={16} />
            <span>
              学员需累计学习 <b>{readingForm.minMinutes || '—'} 分钟</b>，完成后获得 <b>+{readingForm.points || '0'} 积分</b>
            </span>
          </div>
          <button className="btn btn-primary full" onClick={submitReading}>
            保存阅读打卡配置
          </button>
        </div>
      ) : null}

      {tab === 'calc' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>计算打卡设置</h2>
              <p>设置页数上限、每页基础积分与字迹工整奖励</p>
            </div>
          </div>
          <Field label="每日计算打卡页数上限" hint="正整数，范围 1-100">
            <input
              type="number"
              min="1"
              max="100"
              value={calcForm.dailyLimit}
              onChange={(e) => setCalcForm((c) => ({ ...c, dailyLimit: e.target.value }))}
            />
          </Field>
          <Field label="单次提交的计算作业页数" hint="正整数，范围 1-50，且不得大于每日上限">
            <input
              type="number"
              min="1"
              max="50"
              value={calcForm.perSubmit}
              onChange={(e) => setCalcForm((c) => ({ ...c, perSubmit: e.target.value }))}
            />
          </Field>
          <Field label="每页基础积分" hint="整数，范围 0-1000；按本次提交页数累计发放">
            <input
              type="number"
              min="0"
              max="1000"
              value={calcForm.pointsPerPage}
              onChange={(e) => setCalcForm((c) => ({ ...c, pointsPerPage: e.target.value }))}
            />
          </Field>
          <Field label="字迹工整额外奖励" hint="整数，范围 0-1000；仅审核通过且字迹工整时发放">
            <input
              type="number"
              min="0"
              max="1000"
              value={calcForm.neatBonus}
              onChange={(e) => setCalcForm((c) => ({ ...c, neatBonus: e.target.value }))}
            />
          </Field>
          {calcError ? <p className="form-error">{calcError}</p> : null}
          <div className="admin-preview">
            <Calculator size={16} />
            <span>
              每日 <b>{calcForm.dailyLimit || '—'} 页</b>、单次 <b>{calcForm.perSubmit || '—'} 页</b>；每页 <b>+{calcForm.pointsPerPage || '0'}</b>，字迹工整额外 <b>+{calcForm.neatBonus || '0'}</b>
            </span>
          </div>
          <button className="btn btn-primary full" onClick={submitCalc}>
            保存计算打卡配置
          </button>
        </div>
      ) : null}

      {tab === 'gift' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>礼品管理</h2>
              <p>维护商城礼品、库存与解锁条件，下架后学员不可兑换</p>
            </div>
            <button className="mini-btn" onClick={openGiftNew}>
              <Plus size={14} /> 新增
            </button>
          </div>

          <div className="gift-admin-list">
            {gifts.map((gift) => (
              <div key={gift.id} className={`gift-admin-row ${gift.isOnShelf === false ? 'off-shelf' : ''}`}>
                <div className="gift-admin-top">
                  <GiftImage gift={gift} alt={gift.name} className="gift-admin-img" />
                  <div className="gift-admin-main">
                    <div className="gift-admin-heading">
                      <b>{gift.name}</b>
                      <Badge tone={gift.type === 'virtual' ? 'mint' : 'sky'}>
                        {gift.type === 'virtual' ? '虚拟' : '实物'}
                      </Badge>
                    </div>
                    <p className="gift-admin-meta">
                      <Coins size={12} /> {gift.cost} 积分 · {gift.type === 'physical'
                        ? `库存 ${gift.stock} · 预算 ¥${gift.budget}`
                        : gift.avatar
                          ? '兑换后应用头像'
                          : '自动加入装扮库'}
                    </p>
                    <span className="gift-admin-unlock">{giftUnlockText(gift, state.ladders)}</span>
                  </div>
                </div>
                <div className="gift-admin-foot">
                  <Badge tone={gift.isOnShelf === false ? 'neutral' : 'primary'}>
                    {gift.isOnShelf === false ? '已下架' : '已上架'}
                  </Badge>
                  <div className="gift-admin-actions">
                    <button className="mini-btn ghost" onClick={() => handleGiftShelf(gift, gift.isOnShelf === false)}>
                      {gift.isOnShelf === false ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                      {gift.isOnShelf === false ? '上架' : '下架'}
                    </button>
                    <button className="icon-btn small" onClick={() => openGiftEdit(gift)} aria-label={`编辑${gift.name}`}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn small danger" onClick={() => setDeleteGiftId(gift.id)} aria-label={`删除${gift.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {gifts.length === 0 ? <p className="admin-empty">暂无礼品，点击右上角新增。</p> : null}
          </div>

          <div className="admin-tip">
            <AlertTriangle size={14} />
            已被订单、打卡阶梯或学员虚拟权益引用的礼品不可直接删除，可先下架；下架不影响已有订单审核。
          </div>
        </div>
      ) : null}

      {tab === 'review' ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>兑换订单审核</h2>
              <p>审核实物礼品兑换申请，驳回将自动退还积分</p>
            </div>
            <Badge tone={pendingOrders.length ? 'amber' : 'primary'}>{pendingOrders.length} 待审核</Badge>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="admin-empty">暂无待审核订单。</p>
          ) : (
            <div className="review-orders">
              {pendingOrders.map((o) => {
                const applicant = state.users.find((u) => u.id === o.userId)
                const custom = state.customItems.find((c) => c.orderId === o.id)
                return (
                  <div key={o.id} className="review-order">
                    <div className="review-order-head">
                      <b>{o.giftName}</b>
                      <Badge tone="amber">{o.status}</Badge>
                    </div>
                    <p className="review-order-meta">
                      {applicant?.nickname} · {o.cost} 积分 · {formatDateTime(o.createdAt)}
                    </p>
                    {custom ? (
                      <div className="review-order-custom">
                        <MediaImage mediaId={custom.screenshotMediaId} fallback={<Gift size={16} />} />
                        <div>
                          <b>{custom.name}</b>
                          <span>¥{custom.price}</span>
                        </div>
                      </div>
                    ) : null}
                    {o.address ? (
                      <p className="review-order-addr">
                        收货：{o.address.name} {o.address.phone} · {o.address.province}
                        {o.address.city}
                        {o.address.district} {o.address.detail}
                      </p>
                    ) : null}
                    <div className="review-order-actions">
                      <button className="btn btn-ghost small" onClick={() => { setRejectTarget(o); setRejectRemark('') }}>
                        <X size={15} /> 驳回
                      </button>
                      <button className="btn btn-primary small" onClick={() => handleApprove(o)}>
                        <Check size={15} /> 通过并发货
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="shipped-orders">
            <h3>已发货订单</h3>
            {shippedOrders.length === 0 ? (
              <p className="admin-empty">暂无运输中的订单。</p>
            ) : (
              shippedOrders.map((o) => {
                const applicant = state.users.find((u) => u.id === o.userId)
                return (
                  <div key={o.id} className="shipped-row">
                    <span className="shipped-icon">
                      <Truck size={16} />
                    </span>
                    <div>
                      <b>{o.giftName}</b>
                      <span>
                        {applicant?.nickname} · 订单 {o.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <button className="mini-btn ghost" onClick={() => handleComplete(o)}>
                      <Package size={13} /> 标记完成
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      <Sheet
        open={ladderOpen}
        onClose={() => setLadderOpen(false)}
        title={editingLadder ? '编辑阶梯目标' : '新增阶梯目标'}
        subtitle="学员累计打卡达到天数后解锁奖励"
        footer={
          <button className="btn btn-primary full" onClick={submitLadder}>
            {editingLadder ? '保存修改' : '新增阶梯目标'}
          </button>
        }
      >
        <div className="ladder-form">
          <Field label="累计打卡天数" required hint="正整数，范围 1-3650">
            <input
              type="number"
              min="1"
              max="3650"
              placeholder="例如 7"
              value={ladderForm.days}
              onChange={(e) => setLadderForm((f) => ({ ...f, days: e.target.value }))}
            />
          </Field>
          <Field label="奖励名称" required hint="不超过 20 个字">
            <input
              type="text"
              maxLength={20}
              placeholder="例如 阅读新星"
              value={ladderForm.name}
              onChange={(e) => setLadderForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="奖励说明" hint="选填，不超过 60 个字">
            <textarea
              rows={3}
              maxLength={60}
              placeholder="描述这份奖励的意义"
              value={ladderForm.desc}
              onChange={(e) => setLadderForm((f) => ({ ...f, desc: e.target.value }))}
            />
          </Field>
          <Field label="关联礼品" hint="选填，从礼品库中选择">
            <select
              value={ladderForm.giftId}
              onChange={(e) => setLadderForm((f) => ({ ...f, giftId: e.target.value }))}
            >
              <option value="">不关联礼品</option>
              {gifts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}（{g.type === 'virtual' ? '虚拟' : '实物'} · {g.cost} 积分{g.isOnShelf === false ? ' · 已下架' : ''}）
                </option>
              ))}
            </select>
          </Field>
          {ladderError ? <p className="form-error">{ladderError}</p> : null}
        </div>
      </Sheet>

      <Sheet
        open={giftOpen}
        onClose={closeGift}
        title={editingGift ? '编辑礼品' : '新增礼品'}
        subtitle={editingGift ? '修改后立即同步至商城，上下架状态保持不变' : '新礼品保存后默认上架'}
        footer={
          <button className="btn btn-primary full" onClick={submitGift} disabled={giftSaving}>
            {giftSaving ? '保存中…' : editingGift ? '保存修改' : '新增并上架'}
          </button>
        }
      >
        <fieldset className="gift-form" disabled={giftSaving}>
          <Field label="礼品类型" required hint={editingGift ? '为保护历史订单与权益，编辑时不可更换类型' : '新增后礼品类型不可更换'}>
            <select value={giftForm.type} disabled={!!editingGift} onChange={(e) => updateGift('type', e.target.value)}>
              <option value="physical">实物礼品</option>
              <option value="virtual">虚拟礼品</option>
            </select>
          </Field>
          <Field label="礼品名称" required hint="不超过 30 个字">
            <input
              type="text"
              maxLength={30}
              placeholder="例如：创意书签套装"
              value={giftForm.name}
              onChange={(e) => updateGift('name', e.target.value)}
            />
          </Field>
          <Field label="兑换积分" required hint="正整数，范围 1-1000000">
            <input
              type="number"
              min="1"
              max="1000000"
              placeholder="例如：300"
              value={giftForm.cost}
              onChange={(e) => updateGift('cost', e.target.value)}
            />
          </Field>
          <div className="field gift-image-field">
            <span className="field-label">礼品图片（必选）</span>
            <div className="gift-image-preview">
              {giftImagePreviewUrl ? (
                <ImageWithFallback src={giftImagePreviewUrl} alt="新选礼品图片预览" className="gift-image-preview-img" />
              ) : giftForm.imageMediaId || giftForm.image ? (
                <GiftImage gift={giftForm} alt="当前礼品图片" className="gift-image-preview-img" />
              ) : (
                <span className="gift-image-preview-img gift-image-empty"><ImagePlus size={24} /></span>
              )}
              <span>{giftImagePreviewUrl ? `已选择：${giftImageFile?.name || '拍照图片'}` : giftForm.imageMediaId || giftForm.image ? '当前图片，可重新选择' : '请选择图片或拍照'}</span>
            </div>
            <input ref={giftAlbumRef} type="file" accept="image/*" hidden onChange={handleGiftImage} />
            <input ref={giftCameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleGiftImage} />
            <div className="upload-actions">
              <button type="button" className="btn btn-ghost" onClick={() => giftAlbumRef.current?.click()}>
                <ImagePlus size={17} /> {giftImagePreviewUrl ? '重新选择' : '相册选择'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => giftCameraRef.current?.click()}>
                <Camera size={17} /> {giftImagePreviewUrl ? '重新拍照' : '拍照'}
              </button>
            </div>
            <span className="field-hint">图片仅保存在本机，保存后可在商城和订单中显示</span>
          </div>
          <Field label="礼品说明" hint="选填，不超过 120 个字">
            <textarea
              rows={3}
              maxLength={120}
              placeholder="介绍礼品内容、用途或发放方式"
              value={giftForm.desc}
              onChange={(e) => updateGift('desc', e.target.value)}
            />
          </Field>

          {giftForm.type === 'physical' ? (
            <div className="gift-form-grid">
              <Field label="库存数量" required hint="0 表示售罄">
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={giftForm.stock}
                  onChange={(e) => updateGift('stock', e.target.value)}
                />
              </Field>
              <Field label="采购预算（元）" required hint="大于 0，不超过 100">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  placeholder="例如：29"
                  value={giftForm.budget}
                  onChange={(e) => updateGift('budget', e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <label className="gift-avatar-option">
              <input type="checkbox" checked={giftForm.avatar} onChange={(e) => updateGift('avatar', e.target.checked)} />
              <span>
                <b>兑换后应用为头像</b>
                <small>关闭时仅加入学员的虚拟装扮库</small>
              </span>
            </label>
          )}

          <Field label="解锁条件" required>
            <select value={giftForm.unlock.type} onChange={(e) => updateGiftUnlock('type', e.target.value)}>
              <option value="none">无门槛，可直接兑换</option>
              <option value="streak">连续打卡达到指定天数</option>
              <option value="days">累计打卡达到指定天数</option>
              <option value="ladderMax">解锁最高打卡阶梯</option>
            </select>
          </Field>
          {['streak', 'days'].includes(giftForm.unlock.type) ? (
            <Field label="所需打卡天数" required hint="正整数，范围 1-3650">
              <input
                type="number"
                min="1"
                max="3650"
                placeholder="例如：7"
                value={giftForm.unlock.value}
                onChange={(e) => updateGiftUnlock('value', e.target.value)}
              />
            </Field>
          ) : null}
          {giftError ? <p className="form-error">{giftError}</p> : null}
        </fieldset>
      </Sheet>

      <Modal
        open={!!deleteLadderId}
        onClose={() => setDeleteLadderId(null)}
        title="删除阶梯目标"
        description="删除后新学员将不再解锁该阶梯；已解锁学员的奖励记录会保留。确定删除吗？"
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteLadderId(null)}>
              取消
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteLadder}>
              确认删除
            </button>
          </div>
        }
      />

      <Modal
        open={!!deletingGift}
        onClose={() => setDeleteGiftId(null)}
        title={deletingGiftRefs.length ? '无法直接删除礼品' : '删除礼品'}
        description={
          deletingGiftRefs.length
            ? `「${deletingGift?.name}」已关联${deletingGiftRefs.join('、')}，为保护历史记录不可删除。${deletingGift?.isOnShelf !== false ? '可先将其下架。' : '该礼品当前已下架。'}`
            : deletingGift
              ? `确定删除「${deletingGift.name}」吗？删除后不可恢复。`
              : ''
        }
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteGiftId(null)}>
              {deletingGiftRefs.length ? '关闭' : '取消'}
            </button>
            {deletingGiftRefs.length === 0 ? (
              <button className="btn btn-danger" onClick={confirmDeleteGift}>
                确认删除
              </button>
            ) : deletingGift?.isOnShelf !== false ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (handleGiftShelf(deletingGift, false)) setDeleteGiftId(null)
                }}
              >
                改为下架
              </button>
            ) : null}
          </div>
        }
      />

      <Modal
        open={!!pendingMode}
        onClose={() => setPendingMode(null)}
        title="切换目标分解方式"
        description="切换后原方式下的子配置将被清空，确定继续吗？"
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setPendingMode(null)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={() => applyMode(pendingMode)}>
              确认切换
            </button>
          </div>
        }
      />

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="驳回兑换申请"
        description={rejectTarget ? `驳回「${rejectTarget.giftName}」后，将退还 ${rejectTarget.cost} 积分并恢复库存。` : ''}
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>
              取消
            </button>
            <button className="btn btn-danger" onClick={handleReject}>
              确认驳回
            </button>
          </div>
        }
      >
        <Field label="驳回原因" hint="将展示在学员订单中">
          <textarea
            rows={2}
            maxLength={60}
            placeholder="例如：商品超出预算范围"
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
          />
        </Field>
      </Modal>

      <p className="admin-foot">
        <Coins size={13} /> 配置仅影响展示与校验规则，历史打卡与积分记录不会被修改
      </p>
    </div>
  )
}
