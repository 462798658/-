import React, { useEffect, useRef, useState } from 'react'
import { BookOpen, Camera, CheckCircle2, ImagePlus, LockKeyhole, PenLine, Sparkles, X } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { extraFeatureMeta } from '../lib/domain'
import { Badge, EmptyState, MediaImage, PageHeader, ProgressBar, Sheet } from '../components/ui'
import { putMedia } from '../lib/media'
import { formatDateCN, formatDateTime, uid } from '../lib/utils'
import ExtraMilestones from '../components/ExtraMilestones'

export default function ExtraDictation({ feature }) {
  const { state, user, completeExtra, toast, isExtraUnlocked, extraTodayRecords } = useApp()
  const meta = extraFeatureMeta(feature)
  const cfg = state.extraConfig?.[feature] || {}

  const [files, setFiles] = useState([])
  const [neat, setNeat] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const albumRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(
    () => () => {
      files.forEach((f) => URL.revokeObjectURL(f.url))
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

  const addFiles = (list) => {
    const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/'))
    if (!picked.length) {
      toast('请选择图片文件', 'error')
      return
    }
    const room = 6 - files.length
    if (room <= 0) {
      toast('单次最多上传 6 张图片', 'error')
      return
    }
    const next = picked.slice(0, room).map((file) => ({ id: uid('tmp'), file, url: URL.createObjectURL(file) }))
    setFiles((prev) => [...prev, ...next])
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((f) => f.id !== id)
    })
  }

  const submit = async () => {
    if (!files.length) {
      toast('请上传默写图片', 'error')
      return
    }
    if (remaining <= 0) {
      toast('今日次数已用完，明天再来吧', 'error')
      return
    }
    setSubmitting(true)
    try {
      const ids = []
      for (const f of files) {
        const id = uid('media')
        await putMedia(f.file, id)
        ids.push(id)
      }
      const res = completeExtra(feature, { images: ids, neat })
      if (!res.ok) {
        toast(res.message, 'error')
        return
      }
      setResult(res)
      files.forEach((f) => URL.revokeObjectURL(f.url))
      setFiles([])
      toast(`默写打卡成功，+${res.points} 积分`, 'success')
    } catch {
      toast('图片上传失败，请重试', 'error')
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
        right={<Badge tone="amber">+{cfg.points} 积分/{meta.unit}</Badge>}
      />

      <div className="extra-stats">
        <div className="extra-stat">
          <span>累计页数</span>
          <b>{totalPages}</b>
        </div>
        <div className="extra-stat">
          <span>今日完成</span>
          <b>
            {todayRecords.length}/{cfg.dailyLimit}
          </b>
        </div>
        <div className="extra-stat">
          <span>字迹奖励</span>
          <b>+{cfg.neatBonus || 0}</b>
        </div>
      </div>

      <div className="uploader-card card">
        <div className="uploader-head">
          <span>默写作业图片</span>
          <em>{files.length} 张</em>
        </div>
        {remaining <= 0 ? (
          <div className="extra-done-tip">
            <CheckCircle2 size={18} /> 今日已完成 {cfg.dailyLimit} {meta.unit}，明天再来吧
          </div>
        ) : (
          <>
            <div className="upload-grid">
              {files.map((f) => (
                <div key={f.id} className="upload-thumb">
                  <img src={f.url} alt="默写作业" />
                  <button className="thumb-remove" onClick={() => removeFile(f.id)} aria-label="移除">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {files.length < 6 ? (
                <button className="upload-add" onClick={() => albumRef.current?.click()}>
                  <ImagePlus size={22} />
                  <span>添加图片</span>
                </button>
              ) : null}
            </div>
            <input ref={albumRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="upload-actions">
              <button className="btn btn-ghost" onClick={() => cameraRef.current?.click()} type="button">
                <Camera size={17} /> 拍照上传
              </button>
              <button className="btn btn-ghost" onClick={() => albumRef.current?.click()} type="button">
                <ImagePlus size={17} /> 相册选择
              </button>
            </div>
          </>
        )}
        {meta.hasNeat && cfg.neatBonus > 0 ? (
          <label className="extra-neat-toggle">
            <input type="checkbox" checked={neat} onChange={(e) => setNeat(e.target.checked)} />
            <span>
              <Sparkles size={14} /> 本次字迹工整清晰，额外 +{cfg.neatBonus} 积分
            </span>
          </label>
        ) : null}
      </div>

      <button className="btn btn-primary full extra-submit" onClick={submit} disabled={submitting || remaining <= 0 || !files.length}>
        <PenLine size={18} /> {submitting ? '正在上传…' : `提交默写 +${cfg.points} 积分`}
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
                <b>{r.pages} 页默写</b>
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
          <h2>历史记录</h2>
          <p>共 {allRecords.length} 次 · {totalPages} 页</p>
        </div>
      </div>
      {allRecords.length === 0 ? (
        <EmptyState icon={<BookOpen size={26} />} title="还没有默写记录" description="完成第一次默写打卡后，记录会出现在这里。" />
      ) : (
        <div className="extra-record-list">
          {allRecords.slice(0, 20).map((r) => (
            <div key={r.id} className="extra-record">
              <span className="extra-record-thumb">
                {r.images?.[0] ? (
                  <MediaImage mediaId={r.images[0]} className="extra-record-img" fallback={<BookOpen size={18} />} />
                ) : (
                  <BookOpen size={18} />
                )}
              </span>
              <div className="extra-record-main">
                <b>
                  {formatDateCN(r.date)} · {r.pages} 页
                </b>
                <span>{formatDateTime(r.createdAt).split(' ')[1]}</span>
              </div>
              <em>+{r.points}</em>
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={!!result}
        onClose={() => setResult(null)}
        title="默写打卡成功"
        subtitle="本次记录已保存"
        footer={
          <button className="btn btn-primary full" onClick={() => setResult(null)}>
            继续打卡
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
                <span>提交页数</span>
                <b>{result.record.pages} 页</b>
              </div>
              <div>
                <span>基础积分</span>
                <b>+{cfg.points}</b>
              </div>
              <div>
                <span>字迹奖励</span>
                <b>{result.record.neatBonus > 0 ? `+${result.record.neatBonus}` : '无'}</b>
              </div>
              <div>
                <span>累计页数</span>
                <b>{totalPages} 页</b>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
