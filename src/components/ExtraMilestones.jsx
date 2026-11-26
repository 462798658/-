import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Coins, Gift, ImagePlus, Lock, Sparkles, Trophy } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { extraMilestoneDefs } from '../lib/domain'
import { Badge, Field, Modal, ProgressBar, Sheet } from '../components/ui'
import { putMedia } from '../lib/media'
import { uid } from '../lib/utils'

export default function ExtraMilestones({ feature }) {
  const { state, user, claimExtraReward, extraPagesTotal, extraClaimed, toast } = useApp()
  const defs = useMemo(() => extraMilestoneDefs(state.extraConfig, feature), [state.extraConfig, feature])
  const pages = extraPagesTotal(feature)
  const myAddresses = state.addresses.filter((a) => a.userId === user?.id)

  const [confirm, setConfirm] = useState(null)
  const [ultimate, setUltimate] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', link: '', addressId: '', file: null, url: null })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(
    () => () => {
      if (form.url) URL.revokeObjectURL(form.url)
    },
    [form.url],
  )

  if (!defs.length) return null

  const nextDef = defs.find((d) => pages < d.pages)
  const overall = nextDef ? Math.min(100, Math.round((pages / nextDef.pages) * 100)) : 100

  const claimVirtual = () => {
    const def = confirm
    if (!def) return
    const res = claimExtraReward(feature, def.key)
    if (!res.ok) {
      toast(res.message, 'error')
      setConfirm(null)
      return
    }
    toast('虚拟礼品已领取并自动发放', 'success')
    setConfirm(null)
  }

  const openUltimate = (def) => {
    if (form.url) URL.revokeObjectURL(form.url)
    const defAddr = myAddresses.find((a) => a.isDefault) || myAddresses[0]
    setForm({ name: '', price: '', link: '', addressId: defAddr?.id || '', file: null, url: null })
    setUltimate(def)
  }

  const pickFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    if (form.url) URL.revokeObjectURL(form.url)
    setForm((f) => ({ ...f, file, url: URL.createObjectURL(file) }))
  }

  const submitUltimate = async () => {
    if (!ultimate || saving) return
    if (!form.name.trim()) {
      toast('请填写商品名称', 'error')
      return
    }
    const price = Number(form.price)
    if (!Number.isFinite(price) || price <= 0 || price > 100) {
      toast('商品价格需在 1-100 元之间', 'error')
      return
    }
    if (!form.file) {
      toast('请上传商品截图', 'error')
      return
    }
    if (!form.addressId) {
      toast('请先添加并选择收货地址', 'error')
      return
    }
    setSaving(true)
    try {
      const screenshotMediaId = uid('media')
      await putMedia(form.file, screenshotMediaId)
      const res = claimExtraReward(feature, ultimate.key, {
        name: form.name,
        price,
        link: form.link,
        screenshotMediaId,
        addressId: form.addressId,
      })
      if (!res.ok) {
        toast(res.message, 'error')
        return
      }
      toast('终极大礼申请已提交，等待审核发货', 'success')
      setUltimate(null)
    } catch {
      toast('截图上存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="extra-milestones card">
      <div className="extra-milestones-head">
        <div>
          <h2>
            <Trophy size={17} /> 累计奖励
          </h2>
          <p>累计完成默写 / 朗读页数，解锁虚拟礼品与终极大礼</p>
        </div>
        <Badge tone="amber">已累计 {pages} 页</Badge>
      </div>

      <div className="extra-overall">
        <ProgressBar percent={overall} tone="amber" height={7} />
        <span>{nextDef ? `距离 ${nextDef.label} 还差 ${nextDef.pages - pages} 页` : '已解锁全部里程碑奖励'}</span>
      </div>

      <div className="milestone-list">
        {defs.map((d) => {
          const reached = pages >= d.pages
          const claimed = extraClaimed(feature, d.key)
          const isUltimate = d.type === 'ultimate'
          return (
            <div key={d.key} className={`milestone-item ${claimed ? 'claimed' : reached ? 'ready' : ''}`}>
              <span className={`milestone-icon ${isUltimate ? 'ultimate' : 'virtual'}`}>
                {claimed ? <CheckCircle2 size={18} /> : isUltimate ? <Sparkles size={18} /> : <Gift size={18} />}
              </span>
              <div className="milestone-main">
                <b>{isUltimate ? '终极大礼 · 100 元内自选' : `${d.pages} 页虚拟礼品`}</b>
                <span>
                  {isUltimate ? `累计 ${d.pages} 页解锁，自选商品拍照下单` : `累计 ${d.pages} 页解锁`}
                </span>
                <div className="milestone-bar">
                  <ProgressBar percent={Math.min(100, (pages / d.pages) * 100)} tone={claimed ? 'primary' : 'amber'} height={5} />
                </div>
              </div>
              {claimed ? (
                <Badge tone="primary">已领取</Badge>
              ) : reached ? (
                <button
                  className="btn btn-primary small"
                  onClick={() => (isUltimate ? openUltimate(d) : setConfirm(d))}
                >
                  {isUltimate ? '去兑换' : '领取'}
                </button>
              ) : (
                <Badge tone="neutral">
                  <Lock size={11} /> 未达成
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="领取虚拟礼品"
        description={confirm ? `累计达成 ${confirm.pages} 页，可免费领取一份虚拟礼品，领取后自动发放至账户。` : ''}
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={claimVirtual}>
              确认领取
            </button>
          </div>
        }
      >
        <div className="confirm-gift">
          <span className="milestone-icon virtual large">
            <Gift size={22} />
          </span>
          <div>
            <b>{confirm?.label}</b>
            <span>领取后可在「我的兑换订单」中查看</span>
          </div>
        </div>
      </Modal>

      <Sheet
        open={!!ultimate}
        onClose={() => setUltimate(null)}
        title="终极大礼 · 自选商品"
        subtitle="100 元以内任选，拍照上传后提交审核发货"
        footer={
          <button className="btn btn-primary full" onClick={submitUltimate} disabled={saving}>
            {saving ? '提交中…' : '提交兑换申请'}
          </button>
        }
      >
        <div className="ultimate-form">
          <button className="custom-upload" onClick={() => fileRef.current?.click()}>
            {form.url ? (
              <img src={form.url} alt="商品截图" />
            ) : (
              <span>
                <ImagePlus size={22} />
                上传商品截图
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pickFile} />
          <Field label="商品名称" required hint="不超过 30 个字">
            <input
              type="text"
              maxLength={30}
              placeholder="例如：儿童绘本套装"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="商品价格（元）" required hint="需在 100 元以内">
            <input
              type="number"
              min="1"
              max="100"
              placeholder="不超过 100 元"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="购买链接 / 说明" hint="选填">
            <input
              type="text"
              maxLength={120}
              placeholder="可填写商品链接或补充说明"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </Field>
          <Field label="收货地址" required hint={myAddresses.length ? '选择收货地址' : '请先到个人中心添加收货地址'}>
            {myAddresses.length ? (
              <select value={form.addressId} onChange={(e) => setForm((f) => ({ ...f, addressId: e.target.value }))}>
                {myAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.phone} · {a.province}
                    {a.city}
                    {a.district} {a.detail}
                  </option>
                ))}
              </select>
            ) : (
              <button type="button" className="btn btn-ghost full" onClick={() => window.location.assign('#/addresses')}>
                去添加收货地址
              </button>
            )}
          </Field>
          <div className="ultimate-note">
            <Coins size={14} /> 终极大礼为免费奖励，不扣除积分
          </div>
        </div>
      </Sheet>
    </section>
  )
}
