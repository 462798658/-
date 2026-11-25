import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Calculator, ChevronRight, Flame, ImageIcon, PlayCircle } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, Card, PageHeader, ProgressBar } from '../components/ui'
import { formatDateCN, todayKey } from '../lib/utils'

export default function CheckinHub() {
  const { state, user, todayReading, calcPagesToday } = useApp()
  const navigate = useNavigate()
  if (!user) return null

  const { readingConfig, calcConfig } = state
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
