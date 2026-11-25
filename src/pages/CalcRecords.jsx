import React, { useMemo, useState } from 'react'
import { Calculator, CheckCircle2, ImageIcon, Sparkles, XCircle } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, MediaImage, PageHeader, Sheet } from '../components/ui'
import { formatDateCN, formatDateTime, weekdayCN } from '../lib/utils'

export default function CalcRecords() {
  const { state, user } = useApp()
  const [active, setActive] = useState(null)

  const records = useMemo(
    () =>
      state.calcCheckins
        .filter((c) => c.userId === user?.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.calcCheckins, user?.id],
  )

  const totalPages = records.reduce((s, r) => s + (r.pages || 1), 0)
  const neatCount = records.filter((r) => r.neatBonus > 0).length
  const totalPoints = records.reduce((s, r) => s + r.points, 0)

  return (
    <div>
      <PageHeader title="计算打卡记录" subtitle="作业图片与 AI 审核结果" />

      <div className="calc-stats">
        <div className="calc-stat">
          <span>打卡次数</span>
          <b>{records.length}</b>
        </div>
        <div className="calc-stat">
          <span>累计页数</span>
          <b>{totalPages}</b>
        </div>
        <div className="calc-stat">
          <span>字迹奖励</span>
          <b>{neatCount}</b>
        </div>
        <div className="calc-stat">
          <span>累计积分</span>
          <b>{totalPoints}</b>
        </div>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<Calculator size={26} />}
          title="还没有计算打卡记录"
          description="拍照上传计算作业，完成第一次打卡吧。"
        />
      ) : (
        <div className="calc-record-list">
          {records.map((r) => (
            <button key={r.id} className="calc-record" onClick={() => setActive(r)}>
              <span className="calc-record-thumb">
                {r.images?.[0] ? (
                  <MediaImage mediaId={r.images[0]} className="calc-record-img" fallback={<ImageIcon size={20} />} />
                ) : (
                  <span className="calc-record-mock">
                    <Calculator size={19} />
                    <em>{r.pages} 页</em>
                  </span>
                )}
              </span>
              <span className="calc-record-info">
                <span className="calc-record-date">
                  <b>{formatDateCN(r.date)}</b>
                  <i>{weekdayCN(r.date)}</i>
                </span>
                <span className="calc-record-meta">
                  {r.pages} 页作业 · {formatDateTime(r.createdAt).split(' ')[1]}
                </span>
                <span className={`calc-review ${r.review}`}>
                  {r.review === 'passed' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {r.review === 'passed' ? '审核通过' : '审核未通过'}
                  {r.neatBonus > 0 ? (
                    <em>
                      <Sparkles size={11} /> 字迹 +{r.neatBonus}
                    </em>
                  ) : null}
                </span>
              </span>
              <span className="calc-record-points">+{r.points}</span>
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${formatDateCN(active.date)} 计算打卡` : ''}
        subtitle={active ? `${active.pages} 页 · ${formatDateTime(active.createdAt)}` : ''}
      >
        {active ? (
          <div>
            <div className="record-images">
              {active.images?.length ? (
                active.images.map((id, idx) => (
                  <MediaImage key={id} mediaId={id} alt={`作业第 ${idx + 1} 页`} className="record-image" fallback={<div className="record-image mock">第 {idx + 1} 页</div>} />
                ))
              ) : (
                <div className="record-image mock large">
                  <Calculator size={30} />
                  <span>演示记录 · 暂未保留图片</span>
                </div>
              )}
            </div>
            <div className="review-lines">
              <div>
                <span>审核结果</span>
                <b>{active.review === 'passed' ? '通过' : '未通过'}</b>
              </div>
              <div>
                <span>识别正确率</span>
                <b>{active.accuracy ?? '—'}%</b>
              </div>
              <div>
                <span>字迹奖励</span>
                <b>{active.neatBonus > 0 ? `+${active.neatBonus} 积分` : '无'}</b>
              </div>
              <div>
                <span>本次获得</span>
                <b>{active.points} 积分</b>
              </div>
            </div>
            <div className="record-verdict">
              <Badge tone={active.review === 'passed' ? 'primary' : 'danger'}>
                {active.review === 'passed' ? 'AI 审核通过' : 'AI 审核未通过'}
              </Badge>
              <p>
                {active.neatBonus > 0
                  ? '字迹工整清晰，已额外奖励 1 积分。'
                  : active.review === 'passed'
                    ? '审核通过，字迹保持工整可获得额外奖励。'
                    : '本次未通过审核，未获得字迹奖励积分。'}
              </p>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
