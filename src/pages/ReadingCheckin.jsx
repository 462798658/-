import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Camera,
  CheckCircle2,
  Clock3,
  Film,
  Gauge,
  Play,
  RotateCcw,
  Square,
  Upload,
  Video,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, PageHeader, ProgressBar, Ring, Sheet } from '../components/ui'
import { clockText, formatDateTime, todayKey, uid } from '../lib/utils'
import { putMedia } from '../lib/media'
import { POINTS } from '../lib/domain'

export default function ReadingCheckin() {
  const { state, user, todayReading, completeReading, toast } = useApp()
  const navigate = useNavigate()
  const required = state.readingConfig.minMinutes * 60

  const [mode, setMode] = useState('record')
  const [elapsed, setElapsed] = useState(0)
  const [demoSpeed, setDemoSpeed] = useState(false)
  const [recordTiming, setRecordTiming] = useState(false)
  const [recording, setRecording] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const reachedRef = useRef(false)

  const liveRef = useRef(null)
  const playerRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileInputRef = useRef(null)

  const timing = mode === 'record' ? recordTiming : isPlaying

  useEffect(() => {
    if (!timing) return undefined
    const step = demoSpeed ? 60 : 1
    const timer = setInterval(() => setElapsed((e) => e + step), 1000)
    return () => clearInterval(timer)
  }, [timing, demoSpeed])

  useEffect(() => {
    if (elapsed >= required && !reachedRef.current) {
      reachedRef.current = true
      toast(`已达成最少学习时长 ${state.readingConfig.minMinutes} 分钟，可以提交啦`, 'success')
      if (mode === 'watch' && playerRef.current) playerRef.current.pause()
    }
  }, [elapsed, required, mode, state.readingConfig.minMinutes, toast])

  useEffect(
    () => () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (!user) return null

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (liveRef.current) liveRef.current.srcObject = null
  }

  const startRecord = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setCameraError(true)
      toast('当前环境不支持摄像头录制，可使用「模拟录制」体验流程', 'error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (liveRef.current) {
        liveRef.current.srcObject = stream
        await liveRef.current.play().catch(() => {})
      }
      const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported?.(t))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 900000 } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setRecordedBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
      }
      recorder.start(500)
      recorderRef.current = recorder
      setRecording(true)
      setRecordTiming(true)
      setCameraError(false)
    } catch (err) {
      setCameraError(true)
      toast('无法访问摄像头，可使用「模拟录制」体验流程', 'error')
    }
  }

  const stopRecord = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    stopStream()
    setRecording(false)
    setRecordTiming(false)
  }

  const startSimulated = () => {
    setSimulated(true)
    setRecordTiming(true)
  }

  const resetRecord = () => {
    stopRecord()
    setSimulated(false)
    setRecordedBlob(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setElapsed(0)
    reachedRef.current = false
  }

  const pickVideo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast('请选择视频文件', 'error')
      return
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setIsPlaying(false)
    setElapsed(0)
    reachedRef.current = false
  }

  const toggleWatch = async () => {
    const player = playerRef.current
    if (!player) return
    if (player.paused) {
      try {
        await player.play()
        setIsPlaying(true)
      } catch {
        toast('视频播放失败，请重新选择视频', 'error')
      }
    } else {
      player.pause()
      setIsPlaying(false)
    }
  }

  const switchMode = (next) => {
    if (next === mode) return
    if (recordTiming || recording) stopRecord()
    if (playerRef.current) playerRef.current.pause()
    setIsPlaying(false)
    setMode(next)
    setElapsed(0)
    reachedRef.current = false
  }

  const handleSubmit = async () => {
    if (recordTiming) {
      toast('请先停止录制再提交', 'error')
      return
    }
    if (elapsed < required) {
      toast(`学习时长不足，还需 ${Math.ceil((required - elapsed) / 60)} 分钟`, 'error')
      return
    }
    let mediaId = null
    setSubmitting(true)
    try {
      if (mode === 'record' && recordedBlob) {
        mediaId = uid('media')
        await putMedia(recordedBlob, mediaId)
      } else if (mode === 'watch' && videoFile) {
        mediaId = uid('media')
        await putMedia(videoFile, mediaId)
      }
      const result = completeReading({ durationSec: elapsed, mediaId, mode })
      if (!result.ok) {
        toast(result.message, 'error')
        return
      }
      setSuccess(result)
      toast(`阅读打卡成功，+${POINTS.reading} 积分`, 'success')
    } catch {
      toast('视频保存失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (todayReading) {
    return (
      <div>
        <PageHeader title="阅读打卡" subtitle="每日 1 次 · 记录每一段专注时光" />
        <div className="done-panel">
          <div className="done-badge">
            <CheckCircle2 size={34} />
          </div>
          <h2>今日阅读已完成</h2>
          <p>每一次专注，都在悄悄拉开差距。</p>
          <div className="done-stats">
            <div>
              <span>本次学习</span>
              <b>{Math.round(todayReading.durationSec / 60)} 分钟</b>
            </div>
            <div>
              <span>打卡时间</span>
              <b>{formatDateTime(todayReading.createdAt).split(' ')[1]}</b>
            </div>
            <div>
              <span>获得积分</span>
              <b>+{POINTS.reading}</b>
            </div>
          </div>
          <div className="done-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/checkin/reading/history')}>
              <Film size={17} /> 查看历史回放
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
          <p className="done-note">明天再来，保持连续打卡记录哦。</p>
        </div>
      </div>
    )
  }

  const percent = Math.min(100, (elapsed / required) * 100)
  const achieved = elapsed >= required
  const canSubmit = achieved && !timing && !submitting && (mode === 'record' ? simulated || !!recordedBlob : !!videoFile)

  return (
    <div className="reading-page">
      <PageHeader
        title="阅读打卡"
        subtitle="录制或观看学习视频，满时长即可打卡"
        right={<Badge tone="amber">+{POINTS.reading} 积分</Badge>}
      />

      <div className="rule-chips">
        <span>
          <Clock3 size={14} /> 最少 {state.readingConfig.minMinutes} 分钟
        </span>
        <span>
          <BookOpen size={14} /> 每日 1 次
        </span>
        <span>
          <Video size={14} /> 视频留档
        </span>
      </div>

      <div className="mode-segment">
        <button className={mode === 'record' ? 'active' : ''} onClick={() => switchMode('record')}>
          <Camera size={17} /> 录制学习视频
        </button>
        <button className={mode === 'watch' ? 'active' : ''} onClick={() => switchMode('watch')}>
          <Play size={17} /> 观看学习视频
        </button>
      </div>

      <div className="timer-panel">
        <Ring percent={percent} size={212} stroke={10} tone={achieved ? 'primary' : 'amber'}>
          <div className="timer-clock">{clockText(elapsed)}</div>
          <div className="timer-state">
            {achieved ? '已达成最少时长' : `还需 ${clockText(required - elapsed)}`}
          </div>
        </Ring>
        <div className="timer-meta">
          <span>目标 {state.readingConfig.minMinutes} 分钟</span>
          <span className="timer-divider" />
          <span>{timing ? (mode === 'record' ? '录制中' : '观看中') : '已暂停'}</span>
        </div>
        {demoSpeed ? (
          <div className="demo-speed-on">
            <Gauge size={15} /> 演示加速已开启（×60）
          </div>
        ) : null}
      </div>

      <div className="media-stage">
        {mode === 'record' ? (
          <>
            {recording && !simulated ? (
              <div className="live-wrap">
                <video ref={liveRef} muted playsInline autoPlay className="live-video" />
                <span className="live-flag">● REC</span>
              </div>
            ) : previewUrl ? (
              <video src={previewUrl} controls playsInline className="record-preview" />
            ) : simulated && recordTiming ? (
              <div className="mock-record">
                <div className="pulse-dot" />
                <p>模拟录制中</p>
                <span>演示环境未连接摄像头</span>
              </div>
            ) : (
              <div className="placeholder-stage">
                <Camera size={28} />
                <p>{cameraError ? '摄像头不可用' : '准备好后开始录制'}</p>
                <span>{cameraError ? '可使用模拟录制完成打卡流程' : '视频仅保存在本设备浏览器中'}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {videoUrl ? (
              <video
                ref={playerRef}
                src={videoUrl}
                controls
                playsInline
                loop
                className="watch-preview"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="placeholder-stage">
                <Film size={28} />
                <p>选择一段学习视频</p>
                <span>支持本地视频文件，计时随播放进行</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="reading-controls">
        {mode === 'record' ? (
          <>
            {!recording && !recordedBlob && !simulated ? (
              <>
                <button className="btn btn-primary full" onClick={startRecord}>
                  <Camera size={18} /> 开始录制
                </button>
                {cameraError ? (
                  <button className="btn btn-ghost full" onClick={startSimulated}>
                    <Video size={17} /> 使用模拟录制
                  </button>
                ) : null}
              </>
            ) : null}

            {recording || (simulated && recordTiming) ? (
              <button className="btn btn-danger full" onClick={stopRecord}>
                <Square size={16} /> 停止录制
              </button>
            ) : null}

            {recordedBlob || (simulated && !recordTiming) ? (
              <button className="btn btn-ghost full" onClick={resetRecord}>
                <RotateCcw size={17} /> 重新录制
              </button>
            ) : null}
          </>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={pickVideo} />
            <div className="watch-actions">
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload size={17} /> 选择视频
              </button>
              <button className="btn btn-primary" onClick={toggleWatch} disabled={!videoUrl}>
                {isPlaying ? <Square size={16} /> : <Play size={17} />}
                {isPlaying ? '暂停观看' : '开始观看'}
              </button>
            </div>
          </>
        )}

        <button className="btn btn-primary full submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? '正在保存…' : achieved ? `提交打卡 +${POINTS.reading} 积分` : `还差 ${Math.ceil((required - elapsed) / 60)} 分钟`}
        </button>
      </div>

      <div className="demo-toggle card">
        <div>
          <b>演示加速</b>
          <p>以 ×60 速度计时，便于快速体验完整打卡流程</p>
        </div>
        <button
          className={`switch ${demoSpeed ? 'on' : ''}`}
          onClick={() => setDemoSpeed((v) => !v)}
          aria-label="切换演示加速"
        >
          <span />
        </button>
      </div>

      <p className="page-note">提示：提交前请停止录制或暂停播放，系统会校验本次学习时长是否达到 {state.readingConfig.minMinutes} 分钟。</p>

      <Sheet
        open={!!success}
        onClose={() => navigate('/checkin/reading/history')}
        title="阅读打卡成功"
        subtitle="今天的坚持已记录"
        footer={
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              返回首页
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/checkin/reading/history')}>
              查看回放
            </button>
          </div>
        }
      >
        <div className="success-block">
          <div className="success-icon">
            <CheckCircle2 size={30} />
          </div>
          <div className="success-points">+{success?.points || POINTS.reading}</div>
          <p>本次学习 {Math.round((success?.record?.durationSec || 0) / 60)} 分钟</p>
          <ProgressBar percent={100} height={7} />
          <p className="success-note">连续打卡 {user.streakDays} 天 · 累计 {user.totalDays} 天</p>
        </div>
      </Sheet>
    </div>
  )
}
