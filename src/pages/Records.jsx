import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Calculator, CheckCircle2, ChevronRight, XCircle } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, PageHeader, Segmented } from '../components/ui'
import { formatDateCN, weekdayCN } from '../lib/utils'

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'reading', label: '阅读' },
  { value: 'calc', label: '计算' },
]

export default function Records() {
  const { state, user } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const items = useMemo(() => {
    if (!user) return []
    const reading = state.readingCheckins
      .filter((r) => r.userId === user.id)
      .map((r) => ({
        id: r.id,
        kind: 'reading',
        date: r.date,
        createdAt: r.createdAt,
        title: '阅读打卡',
        desc: `学习 ${Math.round(r.durationSec / 60)} 分钟 · ${r.mode === 'record' ? '录制视频' : '观看视频'}`,
        points: 15,
        review: 'passed',
      }))
    const calc = state.calcCheckins
      .filter((c) => c.userId === user.id)
      .map((c) => ({
        id: c.id,
        kind: 'calc',
        date: c.date,
        createdAt: c.createdAt,
        title: '计算打卡',
        desc: `${c.pages} 页作业 · 正确率 ${c.accuracy ?? '—'}%`,
        points: c.points,
        review: c.review,
        neat: c.neatBonus > 0,
      }))
    return [...reading, ...calc].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [state.readingCheckins, state.calcCheckins, user])

  const filtered = items.filter((i) => (filter === 'all' ? true : i.kind === filter))
  const groups = []
  filtered.forEach((item) => {
    let group = groups.find((g) => g.date === item.date)
    if (!group) {
      group = { date: item.date, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  })

  const totalPoints = items.reduce((s, i) => s + i.points, 0)
  const readingCount = items.filter((i) => i.kind === 'reading').length
  const calcPages = state.calcCheckins.filter((c) => c.userId === user?.id).reduce((s, c) => s + c.pages, 0)

  return (
    <div>
      <PageHeader title="我的打卡记录" subtitle="按日期汇总阅读与计算打卡" />

      <div className="records-summary card">
        <div>
          <span>打卡天数</span>
          <b>{user.totalDays}</b>
        </div>
        <div>
          <span>阅读打卡</span>
          <b>{readingCount}</b>
        </div>
        <div>
          <span>计算页数</span>
          <b>{calcPages}</b>
        </div>
        <div>
          <span>累计积分</span>
          <b>{totalPoints}</b>
        </div>
      </div>

      <Segmented options={FILTERS} value={filter} onChange={setFilter} className="records-tabs" />

      {groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={26} />}
          title="暂无打卡记录"
          description="完成阅读或计算打卡后，记录会按日期汇总在这里。"
          action={
            <button className="btn btn-primary" onClick={() => navigate('/checkin')}>
              去打卡
            </button>
          }
        />
      ) : (
        <div className="records-groups">
          {groups.map((group) => (
            <div key={group.date} className="records-group">
              <div className="records-group-head">
                <b>{formatDateCN(group.date)}</b>
                <span>{weekdayCN(group.date)}</span>
                {group.date === new Date().toISOString().slice(0, 10) ? <Badge tone="amber">今天</Badge> : null}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className="record-row"
                  onClick={() => navigate(item.kind === 'reading' ? '/checkin/reading/history' : '/checkin/calc/records')}
                >
                  <span className={`record-row-icon ${item.kind}`}>
                    {item.kind === 'reading' ? <BookOpen size={18} /> : <Calculator size={18} />}
                  </span>
                  <span className="record-row-main">
                    <span className="record-row-title">
                      <b>{item.title}</b>
                      {item.kind === 'calc' ? (
                        <em className={item.review === 'passed' ? 'ok' : 'fail'}>
                          {item.review === 'passed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {item.review === 'passed' ? '通过' : '未通过'}
                        </em>
                      ) : null}
                    </span>
                    <span className="record-row-desc">{item.desc}</span>
                  </span>
                  <span className="record-row-points">+{item.points}</span>
                  <ChevronRight size={15} className="chev" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
