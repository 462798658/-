import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  ScanLine,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, Modal, PageHeader, ProgressBar, Sheet } from '../components/ui'
import { putMedia } from '../lib/media'
import { POINTS } from '../lib/domain'
import { formatDateTime, todayKey, uid } from '../lib/utils'

export default function CalcCheckin() {
  const { state, user, todayCalc, calcPagesToday, completeCalc, toast } = useApp()
  const navigate = useNavigate()
  const { calcConfig } = state

  const [files, setFiles] = useState([])
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const albumRef = useRef(null)
  const cameraRef = useRef(null)

  const remaining = Math.max(0, calcConfig.dailyLimit - calcPagesToday)
  const maxPick = Math.min(calcConfig.perSubmit, remaining)

  useEffect(
    () => () => {
      files.forEach((f) => URL.revokeObjectURL(f.url))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (!user) return null

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!picked.length) {
      toast('请选择图片文件', 'error')
      return
    }
    const room = maxPick - files.length
    if (room <= 0) {
      toast(`单次最多提交 ${calcConfig.perSubmit} 页，今日剩余 ${remaining} 页`, 'error')
      return
    }
    if (picked.length > room) {
      toast(`本次最多还能添加 ${room} 张图片`, 'error')
    }
    const next = picked.slice(0, room).map((file) => ({
      id: uid('tmp'),
      file,
      url: URL.createObjectURL(file),
    }))
    setFiles((prev) => [...prev, ...next])
  }

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((f) => f.id !== id)
    })
  }

  const startReview = async () => {
    if (!files.length) {
      toast('请先拍照或上传计算作业图片', 'error')
      return
    }
    if (files.length > remaining) {
      toast(`今日仅剩 ${remaining} 页可打卡`, 'error')
      return
    }
    if (files.length > calcConfig.perSubmit) {
      toast(`单次最多提交 ${calcConfig.perSubmit} 页`, 'error')
      return
    }
    setScanning(true)
    const pageCount = files.length
    try {
      const ids = []
      for (const f of files) {
        const id = uid('media')
        await putMedia(f.file, id)
        ids.push(id)
      }
      setTimeout(() => {
        const passed = Math.random() > 0.1
        const neat = passed && Math.random() > 0.4
        const accuracy = Math.round(85 + Math.random() * 14)
        const res = completeCalc({
          pages: pageCount,
          images: ids,
          review: passed ? 'passed' : 'rejected',
          neatBonus: neat,
          accuracy,
        })
        setScanning(false)
        if (!res.ok) {
          toast(res.message, 'error')
          return
        }
        setResult({ ...res, accuracy, neat, passed })
        files.forEach((f) => URL.revokeObjectURL(f.url))
        setFiles([])
      }, 1700)
    } catch {
      setScanning(false)
      toast('图片上传失败，请重新上传', 'error')
    }
  }

  const todayPoints = todayCalc.reduce((s, c) => s + c.points, 0)

  return (
    <div className="calc-page">
      <PageHeader
        title="计算打卡"
        subtitle="拍照上传计算作业，AI 智能审核字迹"
        right={<Badge tone="sky">+{POINTS.calcPerPage} 积分/页</Badge>}
      />

      <div className="limit-card card">
        <div className="limit-head">
          <span>
            <Calculator size={16} /> 今日计算进度
          </span>
          <b>
            {calcPagesToday}/{calcConfig.dailyLimit} 页
          </b>
        </div>
        <ProgressBar percent={(calcPagesToday / calcConfig.dailyLimit) * 100} tone="sky" height={9} />
        <div className="limit-foot">
          <span>单次最多 {calcConfig.perSubmit} 页</span>
          <span>今日剩余 {remaining} 页</span>
          <span>已得 {todayPoints} 积分</span>
        </div>
      </div>

      {remaining <= 0 ? (
        <div className="limit-reached">
          <div className="limit-reached-icon">
            <CheckCircle2 size={30} />
          </div>
          <h2>今日计算打卡已完成</h2>
          <p>今日上限 {calcConfig.dailyLimit} 页已全部完成，明天继续加油。</p>
          <button className="btn btn-primary full" onClick={() => navigate('/checkin/calc/records')}>
            查看打卡记录 <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="uploader-card card">
            <div className="uploader-head">
              <span>作业图片</span>
              <em>
                {files.length}/{Math.min(calcConfig.perSubmit, remaining)} 页
              </em>
            </div>
            <div className="upload-grid">
              {files.map((f) => (
                <div key={f.id} className="upload-thumb">
                  <img src={f.url} alt="作业" />
                  <button className="thumb-remove" onClick={() => removeFile(f.id)} aria-label="移除">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {files.length < maxPick ? (
                <button className="upload-add" onClick={() => albumRef.current?.click()}>
                  <ImagePlus size={22} />
                  <span>添加图片</span>
                </button>
              ) : null}
            </div>
            <input ref={albumRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addFiles(e.target.files)} />
            <div className="upload-actions">
              <button className="btn btn-ghost" onClick={() => cameraRef.current?.click()} disabled={files.length >= maxPick}>
                <Camera size={17} /> 拍照上传
              </button>
              <button className="btn btn-ghost" onClick={() => albumRef.current?.click()} disabled={files.length >= maxPick}>
                <ImagePlus size={17} /> 相册选择
              </button>
            </div>
            <p className="upload-tip">
              <Sparkles size={13} />
              AI 将识别作业字迹与对错，字迹工整清晰额外 +{POINTS.neatBonus} 积分
            </p>
          </div>

          <button className="btn btn-primary full review-btn" onClick={startReview} disabled={!files.length}>
            <ScanLine size={18} /> 提交并由 AI 审核
          </button>
          <p className="page-note">
            每日上限与单次页数由管理员配置并实时同步。审核未通过时不计字迹奖励积分。
          </p>
        </>
      )}

      {todayCalc.length > 0 ? (
        <div className="today-submissions">
          <div className="section-title">
            <div>
              <h2>今日提交</h2>
            </div>
            <button className="text-btn" onClick={() => navigate('/checkin/calc/records')}>
              全部记录 <ChevronRight size={14} />
            </button>
          </div>
          {todayCalc.map((c) => (
            <div key={c.id} className="today-submission">
              <span className={`submission-status ${c.review}`}>
                {c.review === 'passed' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              </span>
              <div>
                <b>{c.pages} 页作业</b>
                <span>
                  {formatDateTime(c.createdAt).split(' ')[1]} · {c.review === 'passed' ? '审核通过' : '审核未通过'}
                </span>
              </div>
              <em>+{c.points}</em>
            </div>
          ))}
        </div>
      ) : null}

      <Modal
        open={scanning}
        onClose={() => {}}
        title="AI 正在审核作业"
        description="正在识别字迹清晰度与计算正确率，请稍候…"
      >
        <div className="scan-visual">
          <div className="scan-doc">
            <span />
            <span />
            <span />
            <span />
            <i className="scan-line" />
          </div>
          <div className="scan-dots">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="scan-steps">
          <span>字迹识别</span>
          <span>对错校验</span>
          <span>积分结算</span>
        </div>
      </Modal>

      <Sheet
        open={!!result}
        onClose={() => setResult(null)}
        title={result?.passed ? 'AI 审核通过' : 'AI 审核未通过'}
        subtitle={result?.passed ? '作业已记录，积分已到账' : '本次未获得字迹奖励积分'}
        footer={
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              继续打卡
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/checkin/calc/records')}>
              查看记录
            </button>
          </div>
        }
      >
        {result ? (
          <div className="review-result">
            <div className={`review-icon ${result.passed ? 'passed' : 'failed'}`}>
              {result.passed ? <CheckCircle2 size={32} /> : <AlertTriangle size={30} />}
            </div>
            <div className="review-points">+{result.points} 积分</div>
            <div className="review-lines">
              <div>
                <span>提交页数</span>
                <b>{result.record.pages} 页</b>
              </div>
              <div>
                <span>识别正确率</span>
                <b>{result.accuracy}%</b>
              </div>
              <div>
                <span>字迹工整</span>
                <b>{result.passed ? (result.neat ? '清晰 · 奖励 +1' : '良好') : '不通过'}</b>
              </div>
              <div>
                <span>今日已打卡</span>
                <b>
                  {calcPagesToday}/{calcConfig.dailyLimit} 页
                </b>
              </div>
            </div>
            <p className="review-note">
              {result.passed
                ? result.neat
                  ? '字迹工整清晰，获得额外奖励积分，继续保持！'
                  : '审核通过。书写再工整一些，可以获得额外字迹奖励。'
                : '图片字迹或答案未通过审核，本次无字迹奖励积分，可明日重新打卡。'}
            </p>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
