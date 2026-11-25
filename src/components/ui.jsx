import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, X, Sparkles } from 'lucide-react'
import { getMediaUrl } from '../lib/media'

export function PageHeader({ title, subtitle, back = true, right, onBack }) {
  const navigate = useNavigate()
  return (
    <header className="page-header">
      {back ? (
        <button className="icon-btn" onClick={() => (onBack ? onBack() : navigate(-1))} aria-label="返回">
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span className="icon-btn ghost" />
      )}
      <div className="page-header-titles">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="page-header-right">{right}</div>
    </header>
  )
}

export function Card({ children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {children}
    </section>
  )
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented-item ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ percent = 0, tone = 'primary', height = 8, className = '' }) {
  return (
    <div className={`progress ${className}`} style={{ height }}>
      <div className={`progress-fill tone-${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  )
}

export function Ring({ percent = 0, size = 132, stroke = 9, children, tone = 'amber' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * c
  return (
    <div className={`ring tone-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-value"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export function MediaImage({ mediaId, alt = '', className = '', fallback = null }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    setUrl(null)
    setFailed(false)
    if (!mediaId) {
      setFailed(true)
      return undefined
    }
    getMediaUrl(mediaId)
      .then((u) => {
        if (!alive) return
        if (u) setUrl(u)
        else setFailed(true)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [mediaId])

  if (url) return <img src={url} alt={alt} className={className} />
  if (fallback) return fallback
  return <div className={`media-placeholder ${className}`}>{failed ? <span>图片</span> : null}</div>
}

export function ImageWithFallback({ src, alt = '', className = '', fallback = null }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) return fallback || <div className={`media-placeholder ${className}`} />
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
}

export function GiftImage({ gift, alt = '', className = '', fallback = null }) {
  if (gift?.imageMediaId) {
    return <MediaImage mediaId={gift.imageMediaId} alt={alt} className={className} fallback={fallback} />
  }
  return <ImageWithFallback src={gift?.image} alt={alt} className={className} fallback={fallback} />
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`badge tone-${tone} ${className}`}>{children}</span>
}

export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      {label ? (
        <span className="field-label">
          {label}
          {required ? <i>*</i> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {icon ? <div className="empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

export function Sheet({ open, onClose, title, subtitle, children, footer, size = 'default' }) {
  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-backdrop" onClick={() => onClose?.()} />
      <div className={`sheet sheet-${size}`}>
        <div className="sheet-grab" />
        {(title || onClose) && (
          <div className="sheet-header">
            <div>
              {title ? <h2>{title}</h2> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            <button className="icon-btn" onClick={() => onClose?.()} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

export function Modal({ open, onClose, title, description, children, footer, tone = 'default' }) {
  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="overlay overlay-center" role="dialog" aria-modal="true">
      <div className="overlay-backdrop" onClick={() => onClose?.()} />
      <div className={`modal tone-${tone}`}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={() => onClose?.()} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        {description ? <p className="modal-desc">{description}</p> : null}
        {children}
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

export function ToastHost({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return createPortal(
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast tone-${t.tone}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-dot" />
          <span>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function Celebration({ data, onClose }) {
  if (!data) return null
  const items = [
    ...(data.ladders || []).map((l) => ({ key: `l_${l.id}`, title: l.name, desc: `累计打卡 ${l.days} 天，阶梯奖励已解锁`, tag: '阶梯奖励' })),
    ...(data.stages || []).map((s) => ({ key: `s_${s.stageId}`, title: s.name, desc: `累计完成 ${s.threshold} 页，作业阶段已达成`, tag: '作业阶段' })),
  ]
  return createPortal(
    <div className="overlay overlay-center">
      <div className="overlay-backdrop dark" onClick={onClose} />
      <div className="celebration">
        <div className="celebration-glow" />
        <div className="celebration-icon">
          <Sparkles size={30} />
        </div>
        <p className="celebration-eyebrow">NEW ACHIEVEMENT</p>
        <h2>解锁新成就</h2>
        <div className="celebration-list">
          {items.map((item) => (
            <div key={item.key} className="celebration-item">
              <Badge tone="amber">{item.tag}</Badge>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
        <button className="btn btn-primary full" onClick={onClose}>
          <Check size={18} /> 太棒了
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function ListRow({ icon, title, subtitle, right, onClick, className = '' }) {
  return (
    <button type="button" className={`list-row ${className}`} onClick={onClick}>
      {icon ? <span className="list-row-icon">{icon}</span> : null}
      <span className="list-row-main">
        <span className="list-row-title">{title}</span>
        {subtitle ? <span className="list-row-sub">{subtitle}</span> : null}
      </span>
      <span className="list-row-right">
        {right}
        <ChevronRight size={16} className="chev" />
      </span>
    </button>
  )
}
