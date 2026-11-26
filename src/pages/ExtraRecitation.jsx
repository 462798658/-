import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, LockKeyhole, Mic, Upload, Video, X } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { extraFeatureMeta } from '../lib/domain'
import { Badge, EmptyState, PageHeader, ProgressBar, Sheet } from '../components/ui'
import { putMedia } from '../lib/media'
import { formatDateCN, formatDateTime, uid } from '../lib/utils'
import ExtraMilestones from '../components/ExtraMilestones'

export default function ExtraRecitation() {
  const { state, user, completeExtra, toast, isExtraUnlocked, extraTodayRecords } = useApp()
  const feature = 'recitation'
  const meta = extraFeatureMeta(feature)
  const cfg = state.extraConfig?.[feature] || {}

  const [lessonName, setLessonName] = useState('')
  const [video, setVideo] = useState(null)
  const [voiceClear, setVoiceClear] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  useEffect(
    () => () => {
      if (video?.url) URL.revokeObjectURL(video.url)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (!user) return null

  const unlocked = isExtraUnlocked(feature)
  const todayRecords = extraTodayRecords(feature)
  const remaining = Math.max(0, (cfg.dailyLimit || 0) - todayRecords.length)
  const allRecords = state.extraCheckins
    .filter((r) => r.userId === user.id && r.feature === feature)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const totalPages = allRecords.reduce((s, r) => s + (r.pages || 0), 0)

  const pickVideo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast('请选择视频文件', 'error')
      return
    }
    if (video?.url) URL.revokeObjectURL(video.url)
    setVideo({ file, url: URL.createObjectURL(file) })
  }

  const submit = async () => {
    if (!lessonName.trim()) {
      toast('请填写课文名称', 'error')
      return
    }
    if (!video) {
      toast('请上传朗读视频', 'error')
      return
    }
    if (!voiceClear) {
      toast('请确认朗读声音清晰', 'error')
      return
    }
    if (remaining <= 0) {
      toast('今日次数已用完，明天再来吧', 'error')
      return
    }
    setSubmitting(true)
    try {
      const mediaId = uid('media')
      await putMedia(video.file, mediaId)
      const res = completeExtra(feature, { lessonName, mediaId, voiceClear })
      if (!res.ok) {
        toast(res.message, 'error')
        return
      }
      setResult(res)
      if (video.url) URL.revokeObjectURL(video.url)
      setVideo(null)
      setLessonName('')
      setVoiceClear(false)
      toast(`读课文打卡成功，+${res.points} 积分`, 'success')
    } catch {
      toast('视频上传失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!unlocked) {
    return (
      <div>
        <PageHeader title={meta.name} subtitle={meta.desc} />
        <div className="extra-lock-panel card">
          <div className="extra-lock-icon">
            <LockKeyhole size={30} />
          </div>
          <h2>打卡 {cfg.unlockDays || meta.defaultUnlockDays} 天解锁</h2>
          <p>该功能随累计打卡天数解锁，当前已累计打卡 {user.totalDays} 天。</p>
          <ProgressBar percent={Math.min(100, ((user.totalDays || 0) / (cfg.unlockDays || 1)) * 100)} tone="amber" height={8} />
          <span className="extra-lock-foot">还差 {Math.max(0, (cfg.unlockDays || 0) - (user.totalDays || 0))} 天解锁</span>
        </div>
      </div>
    )
  }

  return (
    <div className="extra-page">
      <PageHeader
        title={meta.name}
        subtitle={meta.desc}
        right={<Badge tone="sky">+{cfg.points} 积分/{meta.unit}</Badge>}
      />

      <div className="extra-stats">
        <div className="extra-stat">
          <span>累计篇数</span>
          <b>{totalPages}</b>
        </div>
        <div className="extra-stat">
          <span>今日完成</span>
          <b>
            {todayRecords.length}/{cfg.dailyLimit}
          </b>
        </div>
        <div className="extra-stat">
          <span>累计积分</span>
          <b>{allRecords.reduce((s, r) => s + r.points, 0)}</b>
        </div>
      </div>

      <div className="recite-tip card">
        <Mic size={16} /> 每次朗读 1 课，需朗读两遍，声音清晰可辨；同一课文不可重复提交。
      </div>

      <div className="uploader-card card">
        <div className="uploader-head">
          <span>朗读视频</span>
          <em>{video ? '已选择' : '未选择'}</em>
        </div>
        {remaining <= 0 ? (
          <div className="extra-done-tip">
            <CheckCircle2 size={18} /> 今日已完成 {cfg.dailyLimit} {meta.unit}，明天再来吧
          </div>
        ) : (
          <>
            {video ? (
              <div className="recite-video">
                <video src={video.url} controls playsInline className="recite-player" />
                <button className="btn btn-ghost small" onClick={() => fileRef.current?.click()}>
                  <Upload size={15} /> 重新上传
                </button>
              </div>
            ) : (
              <button className="recite-upload" onClick={() => fileRef.current?.click()}>
                <Video size={26} />
                <span>上传朗读视频</span>
                <em>支持拍摄或从相册选择，读两遍后上传</em>
              </button>
            )}
            <input ref={fileRef} type="file" accept="video/*" hidden onChange={pickVideo} />
          </>
        )}
      </div>

      <div className="field card extra-field-card">
        <span className="field-label">课文名称<i>*</i></span>
        <input
          type="text"
          maxLength={20}
          placeholder="例如：第 5 课《秋天》"
          value={lessonName}
          onChange={(e) => setLessonName(e.target.value)}
        />
        <span className="field-hint">同一课文仅可朗读一次，不可重复</span>
      </div>

      <label className="extra-neat-toggle card">
        <input type="checkbox" checked={voiceClear} onChange={(e) => setVoiceClear(e.target.checked)} />
        <span>
          <Mic size={14} /> 本次朗读声音清晰可辨
        </span>
      </label>

      <button
        className="btn btn-primary full extra-submit"
        onClick={submit}
        disabled={submitting || remaining <= 0}
      >
        <Mic size={18} /> {submitting ? '正在上传…' : `提交朗读 +${cfg.points} 积分`}
      </button>

      {todayRecords.length > 0 ? (
        <div className="today-submissions">
          <div className="section-title">
            <div>
              <h2>今日提交</h2>
            </div>
          </div>
          {todayRecords.map((r) => (
            <div key={r.id} className="today-submission">
              <span className="submission-status passed">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <b>{r.lessonName || '朗读课文'}</b>
                <span>{formatDateTime(r.createdAt).split(' ')[1]} · 已完成</span>
              </div>
              <em>+{r.points}</em>
            </div>
          ))}
        </div>
      ) : null}

      <ExtraMilestones feature={feature} />

      <div className="section-title">
        <div>
          <h2>朗读记录</h2>
          <p>共 {allRecords.length} 篇</p>
        </div>
      </div>
      {allRecords.length === 0 ? (
        <EmptyState icon={<Mic size={26} />} title="还没有朗读记录" description="完成第一次读课文打卡后，记录会出现在这里。" />
      ) : (
        <div className="extra-record-list">
          {allRecords.slice(0, 20).map((r) => (
            <div key={r.id} className="extra-record">
              <span className="extra-record-thumb">
                <Mic size={18} />
              </span>
              <div className="extra-record-main">
                <b>{r.lessonName || '朗读课文'}</b>
                <span>
                  {formatDateCN(r.date)} · {formatDateTime(r.createdAt).split(' ')[1]}
                </span>
              </div>
              <em>+{r.points}</em>
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={!!result}
        onClose={() => setResult(null)}
        title="读课文打卡成功"
        subtitle="朗读视频已保存"
        footer={
          <button className="btn btn-primary full" onClick={() => setResult(null)}>
            继续朗读
          </button>
        }
      >
        {result ? (
          <div className="review-result">
            <div className="review-icon passed">
              <CheckCircle2 size={32} />
            </div>
            <div className="review-points">+{result.points} 积分</div>
            <div className="review-lines">
              <div>
                <span>课文名称</span>
                <b>{result.record.lessonName}</b>
              </div>
              <div>
                <span>本次积分</span>
                <b>+{result.points}</b>
              </div>
              <div>
                <span>累计篇数</span>
                <b>{totalPages} 篇</b>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
