import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookMarked,
  ChevronRight,
  ClipboardList,
  Coins,
  Gift,
  Info,
  LogOut,
  MapPin,
  RotateCcw,
  ScrollText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, ListRow, MediaImage, Modal, PageHeader, Sheet } from '../components/ui'
import { formatDateCN } from '../lib/utils'

export default function Profile() {
  const { state, user, logout, resetDemo, toast } = useApp()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  if (!user) return null
  const unlocks = state.unlocks[user.id] || { ladders: [], stages: [] }
  const pending = state.orders.filter((o) => o.status === '待审核').length
  const initial = (user.nickname || '学')[0]

  const handleReset = async () => {
    await resetDemo()
    setConfirmReset(false)
    setSettingsOpen(false)
    toast('演示数据已重置', 'success')
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-page">
      <PageHeader title="个人中心" back={false} right={<button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="设置"><Settings2 size={19} /></button>} />

      <section className="profile-card">
        <div className="profile-glow" />
        <div className="profile-top">
          <div className="profile-avatar">
            {user.avatarMediaId ? (
              <MediaImage mediaId={user.avatarMediaId} alt={user.nickname} fallback={<span>{initial}</span>} />
            ) : user.avatar ? (
              <img src={user.avatar} alt={user.nickname} />
            ) : (
              <span>{initial}</span>
            )}
            <i className="profile-avatar-ring" />
          </div>
          <div className="profile-info">
            <h2>{user.nickname}</h2>
            <p>账号：{user.account}</p>
            <div className="profile-badges">
              <Badge tone={user.role === 'admin' ? 'amber' : 'primary'}>
                {user.role === 'admin' ? '管理员' : '学员'}
              </Badge>
              <Badge tone="neutral">加入于 {formatDateCN(user.createdAt)}</Badge>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div>
            <b>{user.streakDays}</b>
            <span>连续打卡</span>
          </div>
          <div>
            <b>{user.totalDays}</b>
            <span>累计打卡</span>
          </div>
          <div>
            <b>{user.totalPages}</b>
            <span>累计页数</span>
          </div>
          <div>
            <b>{user.points}</b>
            <span>可用积分</span>
          </div>
        </div>
      </section>

      <div className="profile-quick">
        <button onClick={() => navigate('/points')}>
          <span className="quick-icon amber">
            <Coins size={18} />
          </span>
          <b>积分中心</b>
          <em>{user.points} 分</em>
        </button>
        <button onClick={() => navigate('/shop')}>
          <span className="quick-icon coral">
            <Gift size={18} />
          </span>
          <b>礼品商城</b>
          <em>{unlocks.ladders.length} 个已解锁</em>
        </button>
        <button onClick={() => navigate('/records')}>
          <span className="quick-icon mint">
            <BookMarked size={18} />
          </span>
          <b>打卡记录</b>
          <em>{user.totalDays} 天</em>
        </button>
      </div>

      <div className="menu-card">
        <ListRow
          icon={<ClipboardList size={18} />}
          title="我的打卡记录"
          subtitle="按日期查看阅读与计算打卡"
          onClick={() => navigate('/records')}
        />
        <ListRow
          icon={<Gift size={18} />}
          title="我的兑换订单"
          subtitle="虚拟礼品与实物礼品订单"
          right={pending > 0 ? <Badge tone="amber">{pending} 待审核</Badge> : null}
          onClick={() => navigate('/orders')}
        />
        <ListRow
          icon={<MapPin size={18} />}
          title="收货地址管理"
          subtitle="新增、编辑、设置默认地址"
          onClick={() => navigate('/addresses')}
        />
        <ListRow
          icon={<ScrollText size={18} />}
          title="规则说明"
          subtitle="查看当前生效的打卡规则"
          onClick={() => navigate('/rules')}
        />
      </div>

      {user.role === 'admin' ? (
        <button className="admin-entry" onClick={() => navigate('/admin')}>
          <span className="admin-entry-icon">
            <ShieldCheck size={22} />
          </span>
          <span className="admin-entry-main">
            <b>规则配置中心</b>
            <i>打卡阶梯 · 作业计划 · 阅读与计算限制</i>
          </span>
          {pending > 0 ? <Badge tone="danger">{pending} 待审核</Badge> : <Badge tone="primary">管理员</Badge>}
          <ChevronRight size={16} />
        </button>
      ) : (
        <div className="profile-tip">
          <Sparkles size={15} />
          <span>坚持打卡，解锁更多专属奖励与装扮</span>
        </div>
      )}

      <div className="menu-card">
        <ListRow icon={<Info size={18} />} title="设置" subtitle="账号、演示数据与版本信息" onClick={() => setSettingsOpen(true)} />
        <ListRow
          icon={<LogOut size={18} />}
          title="退出登录"
          subtitle="下次需要重新登录"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        />
      </div>

      <p className="profile-foot">学习打卡 v1.0 · 让每一次坚持，都看得见</p>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="设置" subtitle="账号与演示环境">
        <div className="settings-list">
          <div className="settings-row">
            <span>当前账号</span>
            <b>{user.nickname} · {user.account}</b>
          </div>
          <div className="settings-row">
            <span>角色</span>
            <b>{user.role === 'admin' ? '管理员' : '学员'}</b>
          </div>
          <div className="settings-row">
            <span>数据存储</span>
            <b>本地浏览器</b>
          </div>
          <div className="settings-row">
            <span>版本</span>
            <b>1.0.0</b>
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost full" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> 重置演示数据
          </button>
          <button
            className="btn btn-danger full"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            <LogOut size={16} /> 退出登录
          </button>
        </div>
        <p className="settings-note">
          演示数据包含预置学员、36 天打卡记录与示例订单，重置后将恢复到初始状态。
        </p>
      </Sheet>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="重置演示数据"
        description="所有打卡记录、积分、订单与规则配置都会恢复为初始演示状态，此操作不可撤销。"
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              取消
            </button>
            <button className="btn btn-danger" onClick={handleReset}>
              确认重置
            </button>
          </div>
        }
      />
    </div>
  )
}
