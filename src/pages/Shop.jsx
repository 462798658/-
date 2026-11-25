import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Coins,
  Gift,
  ImagePlus,
  Lock,
  MapPin,
  Package,
  Plus,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, GiftImage, ImageWithFallback, Modal, PageHeader, Segmented, Sheet } from '../components/ui'
import { giftUnlockText, isGiftUnlocked } from '../lib/domain'
import { putMedia } from '../lib/media'
import { uid } from '../lib/utils'

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'virtual', label: '虚拟礼品' },
  { value: 'physical', label: '实物礼品' },
]

export default function Shop() {
  const { state, user, redeemVirtual, redeemPhysical, toast } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [confirmVirtual, setConfirmVirtual] = useState(false)
  const [addressId, setAddressId] = useState('')
  const [custom, setCustom] = useState({ name: '', price: '', link: '', file: null, url: null })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => () => {
    if (custom.url) URL.revokeObjectURL(custom.url)
  }, [custom.url])

  if (!user) return null

  const unlocks = state.unlocks[user.id] || { ladders: [], stages: [] }
  const myAddresses = state.addresses.filter((a) => a.userId === user.id)
  const availableGifts = state.gifts.filter((g) => g.isOnShelf !== false)
  const gifts = availableGifts.filter((g) => (filter === 'all' ? true : g.type === filter))
  const gift = availableGifts.find((g) => g.id === activeId) || null

  const openGift = (id) => {
    setActiveId(id)
    setConfirmVirtual(false)
    const def = myAddresses.find((a) => a.isDefault) || myAddresses[0]
    setAddressId(def?.id || '')
    if (custom.url) URL.revokeObjectURL(custom.url)
    setCustom({ name: '', price: '', link: '', file: null, url: null })
  }

  const closeGift = () => {
    setActiveId(null)
    setConfirmVirtual(false)
    if (custom.url) URL.revokeObjectURL(custom.url)
    setCustom({ name: '', price: '', link: '', file: null, url: null })
  }

  const statusOf = (item) => {
    const unlocked = isGiftUnlocked(item, user, unlocks, state.ladders)
    const owned = item.type === 'virtual' && user.ownedAvatars?.includes(item.id)
    const enough = user.points >= item.cost
    const stock = item.type === 'virtual' || item.stock > 0
    if (owned) return { key: 'owned', label: '已拥有', tone: 'primary' }
    if (!unlocked) return { key: 'locked', label: '未解锁', tone: 'neutral' }
    if (!stock) return { key: 'soldout', label: '已售罄', tone: 'danger' }
    if (!enough) return { key: 'points', label: '积分不足', tone: 'danger' }
    return { key: 'ready', label: '可兑换', tone: 'amber' }
  }

  const giftStatus = gift ? statusOf(gift) : null
  const giftUnlocked = gift ? isGiftUnlocked(gift, user, unlocks, state.ladders) : false
  const virtualOwned = gift && gift.type === 'virtual' && user.ownedAvatars?.includes(gift.id)
  const canAfford = gift ? user.points >= gift.cost : false
  const inStock = gift ? gift.type === 'virtual' || gift.stock > 0 : false

  const handleVirtual = () => {
    if (!gift) {
      setConfirmVirtual(false)
      toast('该礼品已下架，暂无法兑换', 'error')
      return
    }
    const res = redeemVirtual(gift.id)
    if (!res.ok) {
      toast(res.message, 'error')
      return
    }
    setConfirmVirtual(false)
    setSuccess({ kind: 'virtual', order: res.order, gift })
    toast('兑换成功，礼品已自动发放', 'success')
  }

  const pickCustomImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    if (custom.url) URL.revokeObjectURL(custom.url)
    setCustom((c) => ({ ...c, file, url: URL.createObjectURL(file) }))
  }

  const handlePhysical = async () => {
    if (!gift) {
      toast('该礼品已下架，暂无法兑换', 'error')
      return
    }
    if (!addressId) {
      toast('请先填写收货地址', 'error')
      return
    }
    let screenshotMediaId = null
    if (gift.custom) {
      if (!custom.name.trim()) {
        toast('请填写商品名称', 'error')
        return
      }
      const price = Number(custom.price)
      if (!Number.isFinite(price) || price <= 0) {
        toast('请填写正确的商品价格', 'error')
        return
      }
      if (price > 100) {
        toast('超出预算，商品价格需在 100 元以内', 'error')
        return
      }
      if (!custom.file) {
        toast('请上传商品截图', 'error')
        return
      }
      setSubmitting(true)
      try {
        screenshotMediaId = uid('media')
        await putMedia(custom.file, screenshotMediaId)
      } catch {
        setSubmitting(false)
        toast('商品截图上传失败，请重新上传', 'error')
        return
      }
    }
    const res = redeemPhysical(gift.id, addressId, {
      ...custom,
      price: Number(custom.price),
      screenshotMediaId,
    })
    setSubmitting(false)
    if (!res.ok) {
      toast(res.message, 'error')
      return
    }
    setSuccess({ kind: 'physical', order: res.order, gift })
    toast('兑换申请已提交，等待后台审核', 'success')
  }

  const renderGiftCard = (item) => {
    const s = statusOf(item)
    return (
      <button key={item.id} className={`gift-card ${item.custom ? 'ultimate' : ''}`} onClick={() => openGift(item.id)}>
        <span className="gift-media">
          <GiftImage gift={item} alt={item.name} className="gift-img" />
          <span className={`gift-type ${item.type}`}>{item.type === 'virtual' ? '虚拟' : '实物'}</span>
          {item.custom ? (
            <span className="gift-ultimate-tag">
              <Sparkles size={11} /> 终极奖励
            </span>
          ) : null}
        </span>
        <span className="gift-body">
          <span className="gift-name">{item.name}</span>
          <span className="gift-cost">
            <Coins size={13} /> {item.cost} 积分
          </span>
          <span className="gift-meta">
            {item.type === 'physical' ? (
              item.stock > 0 ? (
                `剩 ${item.stock} 件 · ¥${item.budget} 内`
              ) : (
                '已售罄'
              )
            ) : (
              giftUnlockText(item, state.ladders)
            )}
          </span>
          <span className="gift-status-row">
            <Badge tone={s.tone}>{s.label}</Badge>
            {!isGiftUnlocked(item, user, unlocks, state.ladders) ? <Lock size={12} /> : null}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="shop-page">
      <PageHeader
        title="礼品商城"
        back={false}
        right={
          <button className="points-chip" onClick={() => navigate('/points')}>
            <Coins size={14} /> {user.points}
          </button>
        }
      />

      <section className="shop-hero">
        <div>
          <p className="eyebrow">POINTS REWARD</p>
          <h2>用坚持，换一份心动的礼物</h2>
          <p className="shop-hero-sub">完成阅读与计算打卡，积分实时到账</p>
        </div>
        <div className="shop-hero-badge">
          <Gift size={30} />
        </div>
      </section>

      <Segmented options={FILTERS} value={filter} onChange={setFilter} className="shop-tabs" />

      {gifts.length ? (
        <div className="gift-grid">{gifts.map(renderGiftCard)}</div>
      ) : (
        <EmptyState icon={<Gift size={26} />} title="暂无礼品" description="当前分类暂无上架礼品，请稍后再来看看。" />
      )}

      <div className="shop-note">
        <Package size={15} />
        <p>实物礼品预算 100 元以内，库存有限；虚拟礼品兑换后将自动发放至账户。</p>
      </div>

      <Sheet
        open={!!gift}
        onClose={closeGift}
        title={gift?.name}
        subtitle={gift ? (gift.type === 'virtual' ? '虚拟礼品 · 自动发放' : gift.custom ? '终极奖励 · 自选商品' : '实物礼品 · 需填写地址') : ''}
        footer={
          gift ? (
            <div className="sheet-actions">
              <button className="btn btn-ghost" onClick={closeGift}>
                再看看
              </button>
              {gift.type === 'virtual' ? (
                <button
                  className="btn btn-primary"
                  disabled={giftStatus.key !== 'ready'}
                  onClick={() => setConfirmVirtual(true)}
                >
                  {virtualOwned ? '已拥有' : giftStatus.key === 'locked' ? '未解锁' : giftStatus.key === 'points' ? '积分不足' : '立即兑换'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={giftStatus.key !== 'ready' || submitting}
                  onClick={handlePhysical}
                >
                  {submitting ? '提交中…' : gift.custom ? '提交兑换申请' : '申请兑换'}
                </button>
              )}
            </div>
          ) : null
        }
      >
        {gift ? (
          <div className="gift-detail">
            <div className="gift-detail-media">
              <GiftImage gift={gift} alt={gift.name} className="gift-detail-img" />
            </div>
            <div className="gift-detail-tags">
              <Badge tone={gift.type === 'virtual' ? 'mint' : 'sky'}>{gift.type === 'virtual' ? '虚拟礼品' : '实物礼品'}</Badge>
              <Badge tone="amber">
                <Coins size={11} /> {gift.cost} 积分
              </Badge>
              {gift.type === 'physical' ? <Badge tone="neutral">预算 ¥{gift.budget}</Badge> : null}
            </div>
            <p className="gift-detail-desc">{gift.desc}</p>

            <div className="gift-detail-info">
              <div>
                <span>解锁条件</span>
                <b>{giftUnlockText(gift, state.ladders)}</b>
              </div>
              <div>
                <span>当前积分</span>
                <b>{user.points} 积分</b>
              </div>
              {gift.type === 'physical' ? (
                <div>
                  <span>剩余库存</span>
                  <b>{gift.custom ? '不限量' : `${gift.stock} 件`}</b>
                </div>
              ) : (
                <div>
                  <span>发放方式</span>
                  <b>{gift.avatar ? '自动应用头像' : '自动加入装扮库'}</b>
                </div>
              )}
            </div>

            {giftStatus.key === 'locked' ? (
              <div className="gift-warning">
                <Lock size={15} /> 尚未满足解锁条件：{giftUnlockText(gift, state.ladders)}
              </div>
            ) : null}
            {giftStatus.key === 'points' ? (
              <div className="gift-warning">
                <AlertTriangle size={15} /> 积分不足，还差 {gift.cost - user.points} 积分
              </div>
            ) : null}
            {giftStatus.key === 'soldout' ? (
              <div className="gift-warning">
                <AlertTriangle size={15} /> 该礼品库存不足，暂时无法兑换
              </div>
            ) : null}

            {gift.type === 'physical' ? (
              <div className="redeem-section">
                <div className="redeem-section-head">
                  <h3>收货地址</h3>
                  <button className="text-btn" onClick={() => navigate('/addresses')}>
                    管理地址 <ChevronRight size={13} />
                  </button>
                </div>
                {myAddresses.length === 0 ? (
                  <button className="address-empty" onClick={() => navigate('/addresses')}>
                    <MapPin size={16} />
                    <span>还没有收货地址，点击添加</span>
                    <Plus size={16} />
                  </button>
                ) : (
                  <div className="address-options">
                    {myAddresses.map((a) => (
                      <button
                        key={a.id}
                        className={`address-option ${addressId === a.id ? 'selected' : ''}`}
                        onClick={() => setAddressId(a.id)}
                      >
                        <span className="address-radio" />
                        <span className="address-main">
                          <b>
                            {a.name} <em>{a.phone}</em>
                            {a.isDefault ? <Badge tone="primary">默认</Badge> : null}
                          </b>
                          <span>
                            {a.province}
                            {a.city}
                            {a.district} · {a.detail}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {gift.custom ? (
              <div className="redeem-section">
                <div className="redeem-section-head">
                  <h3>自选商品信息</h3>
                  <Badge tone="amber">100 元以内</Badge>
                </div>
                <div className="custom-form">
                  <button className="custom-upload" onClick={() => fileRef.current?.click()}>
                    {custom.url ? (
                      <img src={custom.url} alt="商品截图" />
                    ) : (
                      <span>
                        <ImagePlus size={22} />
                        上传商品截图
                      </span>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickCustomImage} />
                  <label className="mini-field">
                    <span>商品名称</span>
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="例如：乐高小颗粒积木"
                      value={custom.name}
                      onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))}
                    />
                  </label>
                  <label className="mini-field">
                    <span>商品价格（元）</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="不超过 100 元"
                      value={custom.price}
                      onChange={(e) => setCustom((c) => ({ ...c, price: e.target.value }))}
                    />
                  </label>
                  <label className="mini-field">
                    <span>购买链接 / 说明（选填）</span>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="可填写商品链接或补充说明"
                      value={custom.link}
                      onChange={(e) => setCustom((c) => ({ ...c, link: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      <Modal
        open={confirmVirtual && !!gift}
        onClose={() => setConfirmVirtual(false)}
        title="确认兑换"
        description={gift ? `将使用 ${gift.cost} 积分兑换「${gift.name}」，兑换后积分不可退回。` : ''}
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmVirtual(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleVirtual}>
              确认兑换
            </button>
          </div>
        }
      >
        {gift ? (
          <div className="confirm-gift">
            <GiftImage gift={gift} alt={gift.name} className="confirm-gift-img" />
            <div>
              <b>{gift.name}</b>
              <span>{gift.avatar ? '兑换后自动应用为头像' : '兑换后自动发放至账户'}</span>
            </div>
          </div>
        ) : null}
      </Modal>

      <Sheet
        open={!!success}
        onClose={() => {
          setSuccess(null)
          closeGift()
        }}
        title={success?.kind === 'virtual' ? '兑换成功' : '申请已提交'}
        subtitle={
          success?.kind === 'virtual'
            ? success?.gift?.avatar
              ? '专属头像已自动应用'
              : '礼品已自动发放至账户'
            : '后台审核通过后将安排发货'
        }
        footer={
          <div className="sheet-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSuccess(null)
                closeGift()
              }}
            >
              继续逛逛
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSuccess(null)
                closeGift()
                navigate('/orders')
              }}
            >
              查看订单
            </button>
          </div>
        }
      >
        {success ? (
          <div className="success-block">
            <div className="success-icon">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="redeem-success-title">{success.gift?.name}</h3>
            <p className="redeem-success-points">-{success.order.cost} 积分</p>
            <div className="review-lines">
              <div>
                <span>订单编号</span>
                <b>{success.order.id.slice(-8).toUpperCase()}</b>
              </div>
              <div>
                <span>订单状态</span>
                <b>{success.order.status}</b>
              </div>
              <div>
                <span>所需积分</span>
                <b>{success.order.cost}</b>
              </div>
              <div>
                <span>剩余积分</span>
                <b>{user.points}</b>
              </div>
            </div>
            {success.kind === 'virtual' && success.gift?.avatar ? (
              <div className="avatar-preview">
                <GiftImage gift={success.gift} alt="新头像" />
                <span>已应用为你的新头像</span>
              </div>
            ) : null}
            {success.kind === 'physical' ? (
              <p className="success-note">可在「我的兑换订单」中查看审核进度与物流信息。</p>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
