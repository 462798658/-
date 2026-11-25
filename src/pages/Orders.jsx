import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, ImageWithFallback, MediaImage, PageHeader, Segmented, Sheet } from '../components/ui'
import { formatDateTime } from '../lib/utils'

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: '待审核', label: '待审核' },
  { value: '已发货', label: '已发货' },
  { value: '已完成', label: '已完成' },
]

const STATUS_TONE = {
  待审核: 'amber',
  已发放: 'primary',
  已发货: 'sky',
  已完成: 'primary',
  已驳回: 'danger',
}

export default function Orders() {
  const { state, user } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [logisticsId, setLogisticsId] = useState(null)
  const [detailId, setDetailId] = useState(null)

  if (!user) return null
  const myOrders = state.orders
    .filter((o) => o.userId === user.id)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const filtered = myOrders.filter((o) => (filter === 'all' ? true : o.status === filter))
  const logistics = state.logistics.find((l) => l.id === logisticsId)
  const detail = state.orders.find((o) => o.id === detailId)
  const detailCustom = detail ? state.customItems.find((c) => c.orderId === detail.id) : null

  return (
    <div>
      <PageHeader title="我的兑换订单" subtitle="虚拟礼品即时发放，实物礼品审核后发货" />

      <div className="order-summary card">
        <div>
          <span>全部订单</span>
          <b>{myOrders.length}</b>
        </div>
        <div>
          <span>待审核</span>
          <b>{myOrders.filter((o) => o.status === '待审核').length}</b>
        </div>
        <div>
          <span>运输中</span>
          <b>{myOrders.filter((o) => o.status === '已发货').length}</b>
        </div>
        <button className="text-btn" onClick={() => navigate('/shop')}>
          去兑换 <ChevronRight size={13} />
        </button>
      </div>

      <Segmented options={FILTERS} value={filter} onChange={setFilter} className="order-tabs" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Gift size={26} />}
          title="暂无相关订单"
          description="兑换礼品后，订单会出现在这里，可随时查看审核与物流状态。"
          action={
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>
              去礼品商城
            </button>
          }
        />
      ) : (
        <div className="order-list">
          {filtered.map((order) => {
            const gift = state.gifts.find((g) => g.id === order.giftId)
            const custom = state.customItems.find((c) => c.orderId === order.id)
            return (
              <div key={order.id} className="order-card">
                <div className="order-top">
                  <span className="order-gift-img">
                    {custom ? (
                      <MediaImage mediaId={custom.screenshotMediaId} fallback={<Gift size={20} />} />
                    ) : (
                      <ImageWithFallback src={gift?.image} alt={order.giftName} fallback={<Gift size={20} />} />
                    )}
                  </span>
                  <div className="order-main">
                    <div className="order-title">
                      <b>{order.giftName}</b>
                      <Badge tone={STATUS_TONE[order.status] || 'neutral'}>{order.status}</Badge>
                    </div>
                    <div className="order-meta">
                      <Badge tone={order.giftType === 'virtual' ? 'mint' : 'sky'}>
                        {order.giftType === 'virtual' ? '虚拟' : '实物'}
                      </Badge>
                      <span>{formatDateTime(order.createdAt)}</span>
                      <span>· {order.cost} 积分</span>
                    </div>
                    {order.isCustom && custom ? (
                      <p className="order-custom">
                        自选商品 · ¥{custom.price} {custom.name}
                      </p>
                    ) : null}
                  </div>
                </div>

                {order.status === '已驳回' ? (
                  <div className="order-banner danger">
                    <RotateCcw size={14} /> 审核未通过：{order.remark || '不符合兑换条件'}，积分已原路退还
                  </div>
                ) : null}
                {order.status === '待审核' ? (
                  <div className="order-banner amber">
                    <Clock3 size={14} /> 申请已提交，等待管理员审核
                  </div>
                ) : null}
                {order.status === '已发放' ? (
                  <div className="order-banner primary">
                    <CheckCircle2 size={14} /> 礼品已自动发放至你的账户
                  </div>
                ) : null}

                <div className="order-foot">
                  <span className="order-no">订单号 {order.id.slice(-8).toUpperCase()}</span>
                  <div className="order-actions">
                    {order.address ? (
                      <span className="order-addr">
                        <MapPin size={12} /> {order.address.city}
                        {order.address.district}
                      </span>
                    ) : null}
                    {order.logisticsId ? (
                      <button className="mini-btn" onClick={() => setLogisticsId(order.logisticsId)}>
                        <Truck size={13} /> 物流追踪
                      </button>
                    ) : null}
                    <button className="mini-btn ghost" onClick={() => setDetailId(order.id)}>
                      详情
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={!!logistics} onClose={() => setLogisticsId(null)} title="物流追踪" subtitle={logistics ? `${logistics.company} · ${logistics.trackingNo}` : ''}>
        {logistics ? (
          <div className="logistics">
            <div className="logistics-head">
              <span className="logistics-icon">
                <Truck size={22} />
              </span>
              <div>
                <b>{logistics.status}</b>
                <p>{logistics.latest}</p>
              </div>
            </div>
            <div className="logistics-timeline">
              {logistics.traces.map((t, idx) => (
                <div key={`${t.time}_${idx}`} className={`logistics-step ${idx === 0 ? 'current' : ''}`}>
                  <span className="logistics-dot" />
                  <div>
                    <p>{t.text}</p>
                    <span>{formatDateTime(t.time)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="logistics-foot">
              <Package size={14} /> 运单号 {logistics.trackingNo} · 更新于 {formatDateTime(logistics.updatedAt)}
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={!!detail} onClose={() => setDetailId(null)} title="订单详情" subtitle={detail ? `订单号 ${detail.id.slice(-8).toUpperCase()}` : ''}>
        {detail ? (
          <div className="order-detail">
            <div className="review-lines">
              <div>
                <span>礼品名称</span>
                <b>{detail.giftName}</b>
              </div>
              <div>
                <span>礼品类型</span>
                <b>{detail.giftType === 'virtual' ? '虚拟礼品' : '实物礼品'}</b>
              </div>
              <div>
                <span>订单状态</span>
                <b>{detail.status}</b>
              </div>
              <div>
                <span>消耗积分</span>
                <b>{detail.cost} 积分</b>
              </div>
              <div>
                <span>申请时间</span>
                <b>{formatDateTime(detail.createdAt)}</b>
              </div>
              <div>
                <span>审核时间</span>
                <b>{detail.reviewedAt ? formatDateTime(detail.reviewedAt) : '待审核'}</b>
              </div>
            </div>

            {detail.address ? (
              <div className="order-detail-address">
                <h4>
                  <MapPin size={14} /> 收货信息
                </h4>
                <p>
                  {detail.address.name} {detail.address.phone}
                </p>
                <p>
                  {detail.address.province}
                  {detail.address.city}
                  {detail.address.district} {detail.address.detail}
                </p>
              </div>
            ) : null}

            {detailCustom ? (
              <div className="order-detail-custom">
                <h4>自选商品</h4>
                <div className="custom-detail-row">
                  <MediaImage mediaId={detailCustom.screenshotMediaId} className="custom-detail-img" fallback={<Gift size={18} />} />
                  <div>
                    <b>{detailCustom.name}</b>
                    <span>¥{detailCustom.price} · 审核状态 {detailCustom.status}</span>
                    {detailCustom.link ? <span className="custom-link">{detailCustom.link}</span> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {detail.remark ? <p className="order-detail-remark">备注：{detail.remark}</p> : null}

            {detail.status === '已发货' ? (
              <button className="btn btn-ghost full" onClick={() => { setDetailId(null); setLogisticsId(detail.logisticsId) }}>
                <Truck size={16} /> 查看物流追踪
              </button>
            ) : null}
            {detail.status === '已完成' ? (
              <div className="order-complete">
                <PackageCheck size={18} /> 订单已完成，感谢你的坚持
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
