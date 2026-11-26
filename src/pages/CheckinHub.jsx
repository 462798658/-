import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  BookOpen,
  Calculator,
  ChevronRight,
  Flame,
  ImageIcon,
  Lock,
  Mic,
  PenLine,
  PlayCircle,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, Card, PageHeader, ProgressBar } from '../components/ui'
import { EXTRA_FEATURES } from '../lib/domain'
import { formatDateCN, todayKey } from '../lib/utils'

const EXTRA_ICONS = {
  words: PenLine,
  accumulation: BookOpen,
  recitation: Mic,
  rope: Activity,
}

const EXTRA_ROUTES = {
  words: '/checkin/words',
  accumulation: '/checkin/accumulation',
  recitation: '/checkin/recitation',
  rope: '/checkin/rope',
}

export default function CheckinHub() {
  const { state, user, todayReading, calcPagesToday, toast, isExtraUnlocked, extraPagesTotal, extraTodayRecords } =
    useApp()
  const navigate = useNavigate()
  if (!user) return null

  const { readingConfig, calcConfig, extraConfig } = state
  const readingDone = !!todayReading
  const calcDone = calcPagesToday >= calcConfig.dailyLimit
  const doneCount = (readingDone ? 1 : 0) + (calcDone ? 1 : 0)
  const percent = ((readingDone ? 50 : 0) + Math.min(50, (calcPagesToday / calcConfig.dailyLimit) * 50)) || 0

  return (
    <div className="checkin-hub">
      <PageHeader
        title="打卡中心"
        subtitle={`${formatDateCN(todayKey())} · 今天也要坚持哦`}
        back={false}
        right={
          <Badge tone="primary" className="streak-badge">
            <Flame size={13} /> {user.streakDays} 天
          </Badge>
        }
      />

      <Card className="today-overview">
        <div className="today-overview-top">
          <div>
            <p className="eyebrow">今日完成度</p>
            <h2>
              {doneCount}
              <span>/ 2</span>
            </h2>
          </div>
          <div className="today-overview-meta">
            <span>可用积分</span>
            <b>{user.points}</b>
          </div>
        </div>
        <ProgressBar percent={percent} height={9} />
        <div className="today-overview-foot">
          <span>阅读 {readingDone ? '已完成' : '待完成'}</span>
          <span>
            计算 {calcPagesToday}/{calcConfig.dailyLimit} 页
          </span>
        </div>
      </Card>

      <button
        className={`entry-card reading ${readingDone ? 'done' : ''}`}
        onClick={() => navigate(readingDone ? '/checkin/reading/history' : '/checkin/reading')}
      >
        <span className="entry-icon">
          <BookOpen size={26} />
        </span>
        <span className="entry-main">
          <span className="entry-title">阅读打卡</span>
          <span className="entry-desc">
            {readingDone
              ? `今日已完成 · 学习 ${Math.round(todayReading.durationSec / 60)} 分钟`
              : `录制或观看学习视频，满 ${readingConfig.minMinutes} 分钟`}
          </span>
          <span className="entry-tags">
            <em>每日 1 次</em>
            <em>≥ {readingConfig.minMinutes} 分钟</em>
            <em>+{readingConfig.points} 积分</em>
          </span>
        </span>
        <span className={`entry-cta ${readingDone ? 'ghost' : ''}`}>
          {readingDone ? '看回放' : '去打卡'}
          <ChevronRight size={16} />
        </span>
      </button>

      <button
        className={`entry-card calc ${calcDone ? 'done' : ''}`}
        onClick={() => navigate('/checkin/calc')}
      >
        <span className="entry-icon">
          <Calculator size={26} />
        </span>
        <span className="entry-main">
          <span className="entry-title">计算打卡</span>
          <span className="entry-desc">
            今日 {calcPagesToday}/{calcConfig.dailyLimit} 页 · 拍照上传计算作业
          </span>
          <span className="entry-tags">
            <em>单次 {calcConfig.perSubmit} 页</em>
            <em>AI 审核字迹</em>
            <em>+{calcConfig.pointsPerPage} 积分/页</em>
          </span>
        </span>
        <span className={`entry-cta ${calcDone ? 'ghost' : ''}`}>
          {calcDone ? '看记录' : '去打卡'}
          <ChevronRight size={16} />
        </span>
      </button>

      <div className="section-title hub-extra-title">
        <div>
          <h2>拓展打卡</h2>
          <p>随累计打卡天数逐步解锁，坚持越久玩法越多</p>
        </div>
      </div>

      <div className="extra-entry-list">
        {EXTRA_FEATURES.map((f) => {
          const cfg = extraConfig?.[f.key]
          if (!cfg || cfg.enabled === false) return null
          const Icon = EXTRA_ICONS[f.key]
          const unlocked = isExtraUnlocked(f.key)
          const doneCount = extraTodayRecords(f.key).length
          const done = doneCount >= cfg.dailyLimit
          const pages = extraPagesTotal(f.key)
          const handleClick = () => {
            if (!unlocked) {
              toast(`打卡 ${cfg.unlockDays} 天解锁`, 'default')
              return
            }
            navigate(EXTRA_ROUTES[f.key])
          }
          return (
            <button
              key={f.key}
              className={`entry-card extra ${f.key} ${!unlocked ? 'locked' : done ? 'done' : ''}`}
              onClick={handleClick}
            >
              <span className="entry-icon">
                {unlocked ? <Icon size={24} /> : <Lock size={22} />}
              </span>
              <span className="entry-main">
                <span className="entry-title">{f.name}</span>
                <span className="entry-desc">
                  {!unlocked
                    ? `打卡 ${cfg.unlockDays} 天解锁 · 当前 ${user.totalDays} 天`
                    : f.hasPages
                      ? `累计 ${pages} 页 · 今日 ${doneCount}/${cfg.dailyLimit} ${f.unit}`
                      : `今日 ${doneCount}/${cfg.dailyLimit} 天 · 每组 300 个 + 长高操`}
                </span>
                <span className="entry-tags">
                  <em>{
                    { image: '图片上传', video: '视频上传' }[f.media]
                  }</em>
                  <em>每日 {cfg.dailyLimit} {f.unit}</em>
                  <em>+{cfg.points} 积分</em>
                </span>
              </span>
              <span className={`entry-cta ${!unlocked ? 'lock' : done ? 'ghost' : ''}`}>
                {!unlocked ? '未解锁' : '去打卡'}
                {unlocked ? <ChevronRight size={16} /> : <Lock size={14} />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="hub-links">
        <button className="hub-link" onClick={() => navigate('/checkin/reading/history')}>
          <span className="hub-link-icon mint">
            <PlayCircle size={19} />
          </span>
          <span>
            <b>历史视频回放</b>
            <i>回顾每一次认真学习的瞬间</i>
          </span>
          <ChevronRight size={16} />
        </button>
        <button className="hub-link" onClick={() => navigate('/checkin/calc/records')}>
          <span className="hub-link-icon sky">
            <ImageIcon size={19} />
          </span>
          <span>
            <b>计算打卡记录</b>
            <i>查看作业图片与审核结果</i>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="hub-note">打卡数据按自然日计算，连续打卡中断后将从 1 天重新开始。</p>
    </div>
  )
}
