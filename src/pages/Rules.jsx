import React from 'react'
import { BookOpen, Calculator, Coins, Gift, Layers, LockKeyhole, RefreshCcw, ScrollText, Sparkles, Target } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, PageHeader } from '../components/ui'
import { EXTRA_FEATURES, extraMilestoneDefs, homeworkProgress } from '../lib/domain'
import { formatDateTime } from '../lib/utils'

export default function Rules() {
  const { state } = useApp()
  const { readingConfig, calcConfig, homeworkConfig, ladders, gifts, extraConfig } = state
  const hw = homeworkProgress(homeworkConfig, 0)

  return (
    <div className="rules-page">
      <PageHeader
        title="规则说明"
        subtitle="当前生效的打卡规则 · 由管理员配置"
        right={<Badge tone="neutral">只读</Badge>}
      />

      <div className="rules-sync">
        <RefreshCcw size={14} />
        <span>管理员保存配置后，本页内容实时同步</span>
      </div>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon book">
            <BookOpen size={19} />
          </span>
          <div>
            <h3>阅读打卡</h3>
            <p>每天读一点，积累看得见</p>
          </div>
        </div>
        <ul className="rule-list">
          <li>
            <span>单次最少时长</span>
            <b>{readingConfig.minMinutes} 分钟</b>
          </li>
          <li>
            <span>每日打卡次数</span>
            <b>1 次</b>
          </li>
          <li>
            <span>打卡方式</span>
            <b>录制或观看学习视频</b>
          </li>
          <li>
            <span>积分奖励</span>
            <b>+{readingConfig.points} 积分 / 次</b>
          </li>
        </ul>
        <p className="rule-note">学习时长达到 {readingConfig.minMinutes} 分钟后才可提交，当日不可重复打卡。</p>
      </section>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon calc">
            <Calculator size={19} />
          </span>
          <div>
            <h3>计算打卡</h3>
            <p>拍照上传作业，AI 辅助审核</p>
          </div>
        </div>
        <ul className="rule-list">
          <li>
            <span>每日页数上限</span>
            <b>{calcConfig.dailyLimit} 页</b>
          </li>
          <li>
            <span>单次提交页数</span>
            <b>{calcConfig.perSubmit} 页</b>
          </li>
          <li>
            <span>基础积分</span>
            <b>+{calcConfig.pointsPerPage} 积分 / 页</b>
          </li>
          <li>
            <span>字迹工整奖励</span>
            <b>额外 +{calcConfig.neatBonus} 积分</b>
          </li>
        </ul>
        <p className="rule-note">单次提交页数不得超过每日上限，超出后当日不可继续打卡；审核未通过不发放字迹奖励。</p>
      </section>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon target">
            <Target size={19} />
          </span>
          <div>
            <h3>作业累计目标</h3>
            <p>累计完成页数解锁阶段奖励</p>
          </div>
        </div>
        <div className="rule-target">
          <div>
            <span>累计总目标</span>
            <b>{homeworkConfig.totalPages} 页</b>
          </div>
          <Badge tone="primary">{homeworkConfig.mode === 'daily' ? '按每日目标分解' : '按任务阶段分解'}</Badge>
        </div>
        {homeworkConfig.mode === 'daily' ? (
          <div className="rule-daily">
            <span>每日目标</span>
            <b>{homeworkConfig.dailyPages} 页 / 天</b>
          </div>
        ) : (
          <div className="rule-stages">
            {hw.stageViews.map((s, idx) => (
              <div key={s.id} className="rule-stage">
                <span className="rule-stage-index">{idx + 1}</span>
                <div>
                  <b>{s.name}</b>
                  <p>累计完成 {s.threshold} 页达成</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon amber">
            <Sparkles size={19} />
          </span>
          <div>
            <h3>打卡阶梯奖励</h3>
            <p>连续与累计打卡，解锁成长勋章</p>
          </div>
        </div>
        <div className="rule-ladders">
          {[...ladders].sort((a, b) => a.days - b.days).map((l) => {
            const gift = gifts.find((g) => g.id === l.giftId)
            return (
              <div key={l.id} className="rule-ladder">
                <span className="rule-ladder-days">{l.days}<i>天</i></span>
                <div>
                  <b>{l.name}</b>
                  {l.desc ? <p>{l.desc}</p> : null}
                  {gift ? <em>关联礼品 · {gift.name}</em> : null}
                </div>
              </div>
            )
          })}
          {ladders.length === 0 ? <p className="rule-empty">管理员暂未配置阶梯奖励。</p> : null}
        </div>
      </section>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon mint">
            <Layers size={19} />
          </span>
          <div>
            <h3>拓展打卡</h3>
            <p>随累计打卡天数解锁，默写与朗读积累页数换奖励</p>
          </div>
        </div>
        <div className="rule-extra-list">
          {EXTRA_FEATURES.map((f) => {
            const cfg = extraConfig?.[f.key]
            if (!cfg || cfg.enabled === false) return null
            const defs = extraMilestoneDefs(extraConfig, f.key)
            return (
              <div key={f.key} className="rule-extra">
                <div className="rule-extra-head">
                  <b>{f.name}</b>
                  <Badge tone="amber">打卡 {cfg.unlockDays} 天解锁</Badge>
                </div>
                <p>{f.desc}</p>
                <div className="rule-extra-tags">
                  <em>{f.media === 'video' ? '视频上传' : '图片上传'}</em>
                  <em>每日 {cfg.dailyLimit} {f.unit}</em>
                  <em>+{cfg.points} 积分</em>
                  {f.hasNeat && cfg.neatBonus > 0 ? <em>字迹 +{cfg.neatBonus}</em> : null}
                </div>
                {defs.length ? (
                  <div className="rule-extra-milestones">
                    {defs.map((d) => (
                      <span key={d.key}>
                        {d.pages} 页 · {d.type === 'ultimate' ? '100 元内自选' : '虚拟礼品'}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        <p className="rule-note">拓展打卡需累计打卡达到解锁天数后开放，奖励按累计页数逐步解锁，管理员可实时调整。</p>
      </section>

      <section className="rule-card card">
        <div className="rule-card-head">
          <span className="rule-icon gift">
            <Gift size={19} />
          </span>
          <div>
            <h3>积分与兑换</h3>
            <p>积分从打卡中来，到心愿里去</p>
          </div>
        </div>
        <ul className="rule-list">
          <li>
            <span>虚拟礼品</span>
            <b>兑换后自动发放至账户</b>
          </li>
          <li>
            <span>实物礼品</span>
            <b>填写地址后提交，审核通过发货</b>
          </li>
          <li>
            <span>终极自选奖励</span>
            <b>100 元以内自选商品</b>
          </li>
          <li>
            <span>审核驳回</span>
            <b>订单关闭并退还积分</b>
          </li>
        </ul>
      </section>

      <div className="rules-foot">
        <LockKeyhole size={14} />
        <span>规则仅管理员可修改，学员端实时同步展示</span>
      </div>

      <div className="rules-updated">
        <ScrollText size={14} />
        配置更新时间：{formatDateTime(readingConfig.updatedAt)}
      </div>
    </div>
  )
}
