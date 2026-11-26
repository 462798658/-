import React, { useEffect, useRef, useState } from 'react'
import { Activity, Camera, CheckCircle2, ImagePlus, LockKeyhole, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { extraFeatureMeta } from '../lib/domain'
import { Badge, EmptyState, MediaImage, PageHeader, ProgressBar, Sheet } from '../components/ui'
import { putMedia } from '../lib/media'
import { formatDateCN, formatDateTime, uid } from '../lib/utils'

export default function ExtraRope() {
  const feature = 'rope'
  const { state, user, completeExtra, toast, isExtraUnlocked, extraTodayRecords } = useApp()
  const meta = extraFeatureMeta(feature)
  const cfg = state.extraConfig?.[feature] || {}
  const groups = cfg.groups || 5

  const [slots, setSlots] = useState(() => Array.from({ length: groups }, () => null))
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [activeSlot, setActiveSlot] = useState(null)
  const albumRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    setSlots(Array.from({ length: groups }, () => null))
  }, [groups])

  useEffect(
    () => () => {
      slots.forEach((s) => {
        if (s?.url) URL.revokeObjectURL(s.url)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (!user) return null

  const unlocked = isExtraUnlocked(feature)
  const todayRecords = extraTodayRecords(feature)
  const remaining = Math.max(0, (cfg.dailyLimit || 1) - todayRecords.length)
  const filled = slots.filter(Boolean).length
  const allRecords = state.extraCheckins
    .filter((r) => r.userId === user.id && r.feature === feature)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const openSlot = (idx) => {
    setActiveSlot(idx)
    albumRef.current?.click()
  }

  const assignFile = (file) => {
    if (activeSlot == null) return
    if (!file || !file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    setSlots((prev) => {
      const next = [...prev]
      if (next[activeSlot]?.url) URL.revokeObjectURL(next[activeSlot].url)
      next[activeSlot] = { file, url: URL.createObjectURL(file) }
      return next
    })
  }

  const onPickAlbum = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    assignFile(file)
  }

  const onPickCamera = () => {
    cameraRef.current?.click()
  }

  const onCamera = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    assignFile(file)
  }

  const submit = async () => {
    if (filled < groups) {
      toast(`请完成全部 ${groups} 组照片上传`, 'error')
      return
    }
    if (remaining <= 0) {
      toast('今日跳绳打卡已完成，明天再来吧', 'error')
      return
    }
    setSubmitting(true)
    try {
      const ids = []
      for (const s of slots) {
        const id = uid('media')
        await putMedia(s.file, id)
        ids.push(id)
      }
      const res = completeExtra(feature, { images: ids })
      if (!res.ok) {
        toast(res.message, 'error')
        return
      }
      setResult(res)
      slots.forEach((s) => {
        if (s?.url) URL.revokeObjectURL(s.url)
      })
      setSlots(Array.from({ length: groups }, () => null))
      toast(`跳绳打卡成功，+${res.points} 积分`, 'success')
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
        right={<Badge tone="mint">+{cfg.points} 积分/天</Badge>}
      />

      <div className="extra-stats">
        <div className="extra-stat">
          <span>今日完成</span>
          <b>
            {todayRecords.length}/{cfg.dailyLimit}
          </b>
        </div>
        <div className="extra-stat">
          <span>本次组数</span>
          <b>
            {filled}/{groups}
          </b>
        </div>
        <div className="extra-stat">
          <span>累计积分</span>
          <b>{allRecords.reduce((s, r) => s + r.points, 0)}</b>
        </div>
      </div>

      <div className="recite-tip card">
        <Activity size={16} /> 每天 5 组跳绳 + 长高操，每组 300 个；需上传全部 {groups} 组照片才能获得 {cfg.points} 积分。
      </div>

      <div className="uploader-card card">
        <div className="uploader-head">
          <span>分组照片</span>
          <em>
            {filled}/{groups} 组
          </em>
        </div>
        {remaining <= 0 ? (
          <div className="extra-done-tip">
            <CheckCircle2 size={18} /> 今日跳绳打卡已完成，明天继续加油
          </div>
        ) : (
          <>
            <div className="rope-grid">
              {slots.map((s, idx) => (
                <button key={idx} className={`rope-slot ${s ? 'filled' : ''}`} onClick={() => openSlot(idx)} type="button">
                  {s ? (
                    <img src={s.url} alt={`第 ${idx + 1} 组`} />
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <span>第 {idx + 1} 组</span>
                      <em>300 个 + 长高操</em>
                    </>
                  )}
                  {s ? <i className="rope-slot-tag">第 {idx + 1} 组</i> : null}
                </button>
              ))}
            </div>
            <input ref={albumRef} type="file" accept="image/*" hidden onChange={onPickAlbum} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onCamera} />
            <div className="upload-actions">
              <button className="btn btn-ghost" onClick={onPickCamera} type="button">
                <Camera size={17} /> 拍照补拍
              </button>
            </div>
            <p className="upload-tip">
              <Sparkles size={13} /> 点击任意分组可上传或替换该组照片
            </p>
          </>
        )}
      </div>

      <button
        className="btn btn-primary full extra-submit"
        onClick={submit}
        disabled={submitting || remaining <= 0 || filled < groups}
      >
        <Activity size={18} /> {submitting ? '正在上传…' : filled < groups ? `还差 ${groups - filled} 组` : `提交跳绳 +${cfg.points} 积分`}
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
                <b>{r.pages} 组跳绳</b>
                <span>{formatDateTime(r.createdAt).split(' ')[1]} · 已完成</span>
              </div>
              <em>+{r.points}</em>
            </div>
          ))}
        </div>
      ) : null}

      <div className="section-title">
        <div>
          <h2>跳绳记录</h2>
          <p>共 {allRecords.length} 天</p>
        </div>
      </div>
      {allRecords.length === 0 ? (
        <EmptyState icon={<Activity size={26} />} title="还没有跳绳记录" description="完成第一次跳绳打卡后，记录会出现在这里。" />
      ) : (
        <div className="extra-record-list">
          {allRecords.slice(0, 20).map((r) => (
            <div key={r.id} className="extra-record">
              <span className="extra-record-thumb">
                {r.images?.[0] ? (
                  <MediaImage mediaId={r.images[0]} className="extra-record-img" fallback={<Activity size={18} />} />
                ) : (
                  <Activity size={18} />
                )}
              </span>
              <div className="extra-record-main">
                <b>
                  {formatDateCN(r.date)} · {r.pages} 组
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
        title="跳绳打卡成功"
        subtitle="5 组跳绳已全部完成"
        footer={
          <button className="btn btn-primary full" onClick={() => setResult(null)}>
            太棒了
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
                <span>完成组数</span>
                <b>{result.record.pages} 组</b>
              </div>
              <div>
                <span>单次积分</span>
                <b>+{cfg.points}</b>
              </div>
              <div>
                <span>累计天数</span>
                <b>{allRecords.length} 天</b>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
