import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  Coins,
  Gift,
  Lock,
  Package,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, PageHeader, ProgressBar, Segmented } from '../components/ui'
import { formatDateCN, shiftKey, todayKey } from '../lib/utils'
import { homeworkProgress, nextLadderInfo } from '../lib/domain'

const LOG_ICON = {
  reading: <BookOpen size={17} />,
  calc: <Calculator size={17} />,
  handwriting: <Sparkles size={17} />,
  virtual_redeem: <Gift size={17} />,
  physical_redeem: <Package size={17} />,
  refund: <RotateCcw size={17} />,
}

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'earn', label: '获得' },
  { value: 'spend', label: '消耗' },
]

export default function Points() {
  const { state, user, calcPagesToday } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  if (!user) return null

  const logs = state.pointsLogs.filter((l) => l.userId === user.id)
  const earned = logs.filter((l) => l.points > 0).reduce((s, l) => s + l.points, 0)
  const spent = Math.abs(logs.filter((l) => l.points < 0).reduce((s, l) => s + l.points, 0))
  const filtered = logs.filter((l) => (filter === 'all' ? true : filter === 'earn' ? l.points > 0 : l.points < 0))

  const ladder = nextLadderInfo(state.ladders, user.totalDays)
  const unlocks = state.unlocks[user.id] || { ladders: [], stages: [] }
  const hw = homeworkProgress(state.homeworkConfig, user.totalPages)

  const ladderItems = useMemo(() => {
    const map = new Map()
    state.ladders.forEach((l) => map.set(l.id, { ...l, active: true }))
    unlocks.ladders.forEach((l) => {
      if (!map.has(l.id)) map.set(l.id, { ...l, active: false })
    })
    return [...map.values()].sort((a, b) => a.days - b.days)
  }, [state.ladders, unlocks.ladders])

  const today = todayKey()
  const todayDates = new Set([
    ...state.readingCheckins.filter((r) => r.userId === user.id && r.date === today).map((r) => r.date),
    ...state.calcCheckins.filter((c) => c.userId === user.id && c.date === today).map((c) => c.date),
  ])

  return (
    <div className="points-page">
      <PageHeader
        title="积分中心"
        back={false}
        right={
          <button className="chip-btn" onClick={() => navigate('/shop')}>
            <Gift size={14} /> 去兑换
          </button>
        }
      />

      <section className="points-hero">
        <div className="points-hero-top">
          <span>
            <Coins size={15} /> 当前可用积分
          </span>
          <Badge tone="amber">连续 {user.streakDays} 天</Badge>
        </div>
        <div className="points-balance">{user.points}</div>
        <div className="points-split">
          <div>
            <span>累计获得</span>
            <b>+{earned}</b>
          </div>
          <div>
            <span>累计消耗</span>
            <b>-{spent}</b>
          </div>
          <div>
            <span>累计打卡</span>
            <b>{user.totalDays} 天</b>
          </div>
        </div>
        <p className="points-hero-note">
          {todayDates.size > 0 ? '今日已完成打卡，积分已入账。' : '今日还未打卡，完成阅读与计算即可获得积分。'}
        </p>
      </section>

      <section className="progress-card card">
        <div className="progress-card-head">
          <span className="progress-icon amber">
            <Target size={18} />
          </span>
          <div>
            <h3>阶梯奖励进度</h3>
            <p>累计打卡 {user.totalDays} 天</p>
          </div>
          {ladder.next ? <b className="progress-remain">还差 {ladder.remaining} 天</b> : <Badge tone="primary">已全部解锁</Badge>}
        </div>
        <ProgressBar percent={ladder.percent} tone="amber" height={8} />
        <div className="ladder-timeline">
          {ladderItems.map((item) => {
            const unlocked = unlocks.ladders.some((u) => u.id === item.id)
            const gift = state.gifts.find((g) => g.id === item.giftId)
            return (
              <div key={item.id} className={`ladder-step ${unlocked ? 'unlocked' : ''}`}>
                <span className="ladder-dot">{unlocked ? <Check size={12} /> : <Lock size={11} />}</span>
                <div className="ladder-body">
                  <div className="ladder-title">
                    <b>{item.name}</b>
                    <span>{item.days} 天</span>
                  </div>
                  {item.desc ? <p>{item.desc}</p> : null}
                  {gift ? <em className="ladder-gift">关联礼品 · {gift.name}</em> : null}
                </div>
                <span className={`ladder-state ${unlocked ? 'on' : ''}`}>{unlocked ? '已解锁' : '未解锁'}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="progress-card card">
        <div className="progress-card-head">
          <span className="progress-icon mint">
            <BookOpen size={18} />
          </span>
          <div>
            <h3>作业累计进度</h3>
            <p>
              已完成 {user.totalPages}/{state.homeworkConfig.totalPages} 页
            </p>
          </div>
          <b className="progress-remain">{hw.percent}%</b>
        </div>
        <ProgressBar percent={hw.percent} tone="primary" height={8} />
        {state.homeworkConfig.mode === 'daily' ? (
          <div className="hw-daily">
            <div>
              <span>每日目标</span>
              <b>{state.homeworkConfig.dailyPages} 页</b>
            </div>
            <div>
              <span>今日已完成</span>
              <b>{calcPagesToday} 页</b>
            </div>
            <div>
              <span>今日状态</span>
              <b>{calcPagesToday >= state.homeworkConfig.dailyPages ? '已达成' : '进行中'}</b>
            </div>
          </div>
        ) : (
          <div className="hw-stages">
            {hw.stageViews.map((stage) => (
              <div key={stage.id} className={`hw-stage ${stage.unlocked ? 'unlocked' : ''}`}>
                <div className="hw-stage-head">
                  <span>{stage.unlocked ? <Check size={12} /> : null}{stage.name}</span>
                  <em>{stage.threshold} 页</em>
                </div>
                <ProgressBar percent={stage.percent} tone={stage.unlocked ? 'primary' : 'neutral'} height={6} />
              </div>
            ))}
          </div>
        )}
        <p className="hw-next">
          {hw.nextStage
            ? `下一阶段「${hw.nextStage.name}」需累计 ${hw.nextStage.threshold} 页，还差 ${Math.max(0, hw.nextStage.threshold - user.totalPages)} 页`
            : '已完成全部作业阶段目标，太厉害了！'}
        </p>
      </section>

      <div className="log-head">
        <h2>积分流水</h2>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} className="small-segmented" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Coins size={24} />} title="暂无积分记录" description="完成打卡或兑换礼品后，这里会记录每一笔积分变动。" />
      ) : (
        <div className="log-list">
          {filtered.map((log) => (
            <div key={log.id} className="log-item">
              <span className={`log-icon ${log.points > 0 ? 'earn' : 'spend'}`}>{LOG_ICON[log.type] || <Coins size={17} />}</span>
              <div className="log-main">
                <b>{log.label}</b>
                <span>{formatDateCN(log.createdAt)} · 余额 {log.balanceAfter}</span>
              </div>
              <span className={`log-points ${log.points > 0 ? 'earn' : 'spend'}`}>
                {log.points > 0 ? '+' : ''}
                {log.points}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="text-btn points-more" onClick={() => navigate('/shop')}>
        查看可兑换礼品 <ChevronRight size={14} />
      </button>
    </div>
  )
}
