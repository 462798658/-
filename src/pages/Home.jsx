import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calculator,
  ChevronRight,
  Coins,
  Flame,
  Gift,
  History,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, Card, ProgressBar, Ring, SectionTitle } from '../components/ui'
import { formatDateCN, greeting, shiftKey, todayKey, weekdayCN } from '../lib/utils'
import { nextLadderInfo, homeworkProgress } from '../lib/domain'

export default function Home() {
  const { state, user, todayReading, todayCalc, calcPagesToday } = useApp()
  const navigate = useNavigate()
  if (!user) return null

  const today = todayKey()
  const { readingConfig, calcConfig, ladders, homeworkConfig } = state
  const readingDone = !!todayReading
  const calcDone = calcPagesToday >= calcConfig.dailyLimit

  const ringPercent = (readingDone ? 50 : 0) + (calcPagesToday > 0 ? 50 : 0)
  const ladder = nextLadderInfo(ladders, user.totalDays)
  const unlocks = state.unlocks[user.id] || { ladders: [], stages: [] }
  const hw = homeworkProgress(homeworkConfig, user.totalPages)

  const checkDates = new Set([
    ...state.readingCheckins.filter((r) => r.userId === user.id).map((r) => r.date),
    ...state.calcCheckins.filter((c) => c.userId === user.id).map((c) => c.date),
  ])
  const week = Array.from({ length: 7 }, (_, idx) => {
    const key = shiftKey(today, idx - 6)
    return { key, done: checkDates.has(key), today: key === today }
  })

  const initial = (user.nickname || '学')[0]
  const pendingReviews = state.orders.filter((o) => o.status === '待审核').length

  return (
    <div className="home">
      <header className="home-header">
        <div>
          <p className="home-date">
            {formatDateCN(today)} · {weekdayCN(today)}
          </p>
          <h1>
            {greeting()}，{user.nickname}
          </h1>
        </div>
        <button className="avatar-btn" onClick={() => navigate('/profile')} aria-label="个人中心">
          {user.avatar ? <img src={user.avatar} alt={user.nickname} /> : <span>{initial}</span>}
        </button>
      </header>

      <section className="hero-card">
        <div className="hero-glow" />
        <div className="hero-top">
          <div className="hero-streak">
            <span className="hero-kicker">
              <Flame size={15} /> 连续打卡
            </span>
            <div className="hero-number">
              {user.streakDays}
              <small>天</small>
            </div>
            <p className="hero-sub">累计打卡 {user.totalDays} 天 · 累计作业 {user.totalPages} 页</p>
          </div>
          <Ring percent={ringPercent} size={116} stroke={8}>
            <b>{ringPercent / 50}/2</b>
            <span>今日打卡</span>
          </Ring>
        </div>

        <div className="hero-progress">
          {ladder.next ? (
            <>
              <div className="hero-progress-head">
                <span>
                  下一阶梯 · {ladder.next.name}
                </span>
                <span>
                  {user.totalDays}/{ladder.next.days} 天
                </span>
              </div>
              <ProgressBar percent={ladder.percent} tone="amber" height={7} />
              <p className="hero-progress-foot">再坚持 {ladder.remaining} 天，解锁「{ladder.next.name}」</p>
            </>
          ) : (
            <p className="hero-progress-foot">已解锁全部阶梯奖励，继续保持这份自律。</p>
          )}
        </div>

        <div className="hero-foot">
          <div>
            <b>{user.points}</b>
            <span>可用积分</span>
          </div>
          <div>
            <b>{unlocks.ladders.length}</b>
            <span>阶梯奖励</span>
          </div>
          <div>
            <b>{hw.percent}%</b>
            <span>作业目标</span>
          </div>
        </div>
      </section>

      <Card className="week-card">
        <div className="week-head">
          <span>最近 7 天</span>
          <span className="week-legend">
            <i className="dot done" /> 已打卡
            <i className="dot" /> 待打卡
          </span>
        </div>
        <div className="week-days">
          {week.map((d) => (
            <div key={d.key} className={`week-day ${d.today ? 'today' : ''} ${d.done ? 'done' : ''}`}>
              <span className="week-label">{weekdayCN(d.key).slice(1)}</span>
              <span className="week-circle">{d.done ? <Sparkles size={14} /> : d.key.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle title="今日任务" subtitle={`阅读需满 ${readingConfig.minMinutes} 分钟 · 计算上限 ${calcConfig.dailyLimit} 页`} />
      <div className="task-list">
        <button
          className={`task-card ${readingDone ? 'done' : ''}`}
          onClick={() => navigate('/checkin/reading')}
        >
          <span className="task-icon book">
            <BookOpen size={22} />
          </span>
          <span className="task-body">
            <span className="task-title">阅读打卡</span>
            <span className="task-desc">
              {readingDone ? `已完成 · 本次学习 ${Math.round(todayReading.durationSec / 60)} 分钟` : `观看或录制视频，满 ${readingConfig.minMinutes} 分钟即可打卡`}
            </span>
          </span>
          <span className={`task-action ${readingDone ? 'done' : ''}`}>
            {readingDone ? '已完成' : '去打卡'}
            {!readingDone && <ChevronRight size={15} />}
          </span>
        </button>

        <button className={`task-card ${calcDone ? 'done' : ''}`} onClick={() => navigate('/checkin/calc')}>
          <span className="task-icon calc">
            <Calculator size={22} />
          </span>
          <span className="task-body">
            <span className="task-title">计算打卡</span>
            <span className="task-desc">
              今日 {calcPagesToday}/{calcConfig.dailyLimit} 页 · 单次最多 {calcConfig.perSubmit} 页
            </span>
          </span>
          <span className={`task-action ${calcDone ? 'done' : ''}`}>
            {calcDone ? '已完成' : `剩 ${calcConfig.dailyLimit - calcPagesToday} 页`}
            {!calcDone && <ChevronRight size={15} />}
          </span>
        </button>
      </div>

      <SectionTitle title="快捷入口" />
      <div className="quick-grid">
        <button className="quick-item" onClick={() => navigate('/points')}>
          <span className="quick-icon amber">
            <Coins size={20} />
          </span>
          <span>积分中心</span>
          <em>{user.points}</em>
        </button>
        <button className="quick-item" onClick={() => navigate('/shop')}>
          <span className="quick-icon coral">
            <Gift size={20} />
          </span>
          <span>礼品商城</span>
          <em>{state.gifts.filter((g) => g.isOnShelf !== false).length} 件好礼</em>
        </button>
        <button className="quick-item" onClick={() => navigate('/checkin/reading/history')}>
          <span className="quick-icon mint">
            <History size={20} />
          </span>
          <span>视频回放</span>
          <em>{state.readingCheckins.filter((r) => r.userId === user.id).length} 条</em>
        </button>
        <button className="quick-item" onClick={() => navigate('/rules')}>
          <span className="quick-icon sky">
            <ScrollText size={20} />
          </span>
          <span>规则说明</span>
          <em>实时同步</em>
        </button>
      </div>

      {user.role === 'admin' ? (
        <button className="admin-banner" onClick={() => navigate('/admin')}>
          <span className="admin-banner-icon">
            <ShieldCheck size={20} />
          </span>
          <span>
            <b>规则配置中心</b>
            <i>阶梯目标 · 作业计划 · 打卡限制</i>
          </span>
          {pendingReviews > 0 ? <Badge tone="danger">{pendingReviews} 待审核</Badge> : null}
          <ChevronRight size={16} />
        </button>
      ) : null}
    </div>
  )
}
