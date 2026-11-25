import React, { useEffect, useMemo, useState } from 'react'
import { Film, PlayCircle, Video } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, PageHeader, Sheet } from '../components/ui'
import { formatDateCN, weekdayCN } from '../lib/utils'
import { getMediaUrl } from '../lib/media'
import { POINTS } from '../lib/domain'

const SAMPLE_VIDEO = `${import.meta.env.BASE_URL}sample-reading.mp4`

export default function ReadingHistory() {
  const { state, user } = useApp()
  const [active, setActive] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const records = useMemo(
    () =>
      state.readingCheckins
        .filter((r) => r.userId === user?.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.readingCheckins, user?.id],
  )

  useEffect(() => {
    let alive = true
    setVideoUrl(null)
    if (!active) return undefined
    if (!active.mediaId) {
      setVideoUrl(SAMPLE_VIDEO)
      setLoading(false)
      return undefined
    }
    setLoading(true)
    getMediaUrl(active.mediaId)
      .then((url) => {
        if (alive) setVideoUrl(url || SAMPLE_VIDEO)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [active])

  const totalMinutes = Math.round(records.reduce((s, r) => s + r.durationSec, 0) / 60)
  const totalPoints = records.reduce((s, r) => s + (r.points ?? POINTS.reading), 0)
  const groups = []
  records.forEach((r) => {
    const key = r.date.slice(0, 7)
    const label = `${key.slice(0, 4)} 年 ${Number(key.slice(5))} 月`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, label, items: [] }
      groups.push(group)
    }
    group.items.push(r)
  })

  return (
    <div>
      <PageHeader title="历史视频回放" subtitle="每一段专注，都值得被记录" />

      <div className="history-stats card">
        <div>
          <span>累计阅读</span>
          <b>{records.length} 次</b>
        </div>
        <div className="history-divider" />
        <div>
          <span>累计时长</span>
          <b>{totalMinutes} 分钟</b>
        </div>
        <div className="history-divider" />
        <div>
          <span>获得积分</span>
          <b>{totalPoints}</b>
        </div>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<Film size={26} />}
          title="还没有阅读打卡记录"
          description="完成一次阅读打卡后，视频会自动出现在这里。"
        />
      ) : (
        groups.map((group) => (
          <div key={group.key} className="history-group">
            <p className="history-group-label">{group.label}</p>
            <div className="history-list">
              {group.items.map((r) => (
                <button key={r.id} className="history-item" onClick={() => setActive(r)}>
                  <span className="history-thumb">
                    <Film size={20} />
                    <span className="history-play"><PlayCircle size={22} /></span>
                  </span>
                  <span className="history-info">
                    <b>{formatDateCN(r.date)} · {weekdayCN(r.date)}</b>
                    <span>
                      学习 {Math.round(r.durationSec / 60)} 分钟 · {r.mode === 'record' ? '录制视频' : '观看视频'}
                    </span>
                  </span>
                  <Badge tone="primary">+{r.points ?? POINTS.reading}</Badge>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${formatDateCN(active.date)} 阅读打卡` : ''}
        subtitle={active ? `学习 ${Math.round(active.durationSec / 60)} 分钟 · ${active.mode === 'record' ? '录制视频' : '观看视频'}` : ''}
      >
        {active ? (
          <div>
            {videoUrl ? (
              <>
                <video src={videoUrl} controls playsInline className="history-player" />
                {!active.mediaId ? (
                  <p className="history-player-note">演示视频 · 真实录制打卡后，这里将回放你的视频</p>
                ) : null}
              </>
            ) : (
              <div className="history-player-placeholder">
                <Video size={30} />
                <p>{loading ? '正在加载视频…' : '该记录暂无本地视频文件'}</p>
                <span>录制打卡后即可在此回放。</span>
              </div>
            )}
            <div className="detail-grid">
              <div>
                <span>打卡日期</span>
                <b>{formatDateCN(active.date)}</b>
              </div>
              <div>
                <span>学习时长</span>
                <b>{Math.round(active.durationSec / 60)} 分钟</b>
              </div>
              <div>
                <span>打卡方式</span>
                <b>{active.mode === 'record' ? '录制视频' : '观看视频'}</b>
              </div>
              <div>
                <span>获得积分</span>
                <b>+{active.points ?? POINTS.reading}</b>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
