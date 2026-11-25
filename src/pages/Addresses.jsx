import React, { useState } from 'react'
import { Check, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { Badge, EmptyState, Field, Modal, PageHeader, Sheet } from '../components/ui'

const emptyForm = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
}

export default function Addresses() {
  const { state, user, saveAddress, deleteAddress, setDefaultAddress, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState(null)

  if (!user) return null
  const addresses = state.addresses.filter((a) => a.userId === user.id)

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, isDefault: addresses.length === 0 })
    setOpen(true)
  }

  const openEdit = (addr) => {
    setEditing(addr)
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      isDefault: addr.isDefault,
    })
    setOpen(true)
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = () => {
    const result = saveAddress(form, editing?.id)
    if (!result.ok) {
      toast(result.message, 'error')
      return
    }
    toast(editing ? '地址已更新' : '地址已添加', 'success')
    setOpen(false)
  }

  const handleDelete = () => {
    const result = deleteAddress(deleteId)
    if (!result.ok) toast(result.message, 'error')
    else toast('地址已删除', 'success')
    setDeleteId(null)
  }

  return (
    <div>
      <PageHeader
        title="收货地址管理"
        subtitle="实物礼品兑换时需要填写收货地址"
        right={
          <button className="icon-btn filled" onClick={openNew} aria-label="新增地址">
            <Plus size={18} />
          </button>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={26} />}
          title="还没有收货地址"
          description="添加地址后，兑换实物礼品时可直接选择。"
          action={
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={17} /> 新增地址
            </button>
          }
        />
      ) : (
        <div className="address-list">
          {addresses.map((a) => (
            <div key={a.id} className={`address-card ${a.isDefault ? 'default' : ''}`}>
              <div className="address-card-head">
                <b>{a.name}</b>
                <em>{a.phone}</em>
                {a.isDefault ? <Badge tone="primary">默认地址</Badge> : null}
              </div>
              <p>
                {a.province}
                {a.city}
                {a.district}
              </p>
              <p className="address-detail">{a.detail}</p>
              <div className="address-actions">
                {!a.isDefault ? (
                  <button className="mini-btn ghost" onClick={() => setDefaultAddress(a.id)}>
                    <Check size={13} /> 设为默认
                  </button>
                ) : (
                  <span className="address-default-tip">
                    <Check size={13} /> 默认收货地址
                  </span>
                )}
                <div className="address-actions-right">
                  <button className="mini-btn ghost" onClick={() => openEdit(a)}>
                    <Pencil size={13} /> 编辑
                  </button>
                  <button className="mini-btn danger" onClick={() => setDeleteId(a.id)}>
                    <Trash2 size={13} /> 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button className="add-address-row" onClick={openNew}>
            <Plus size={17} /> 新增收货地址
          </button>
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? '编辑收货地址' : '新增收货地址'}
        subtitle="请填写真实有效的收货信息"
        footer={
          <button className="btn btn-primary full" onClick={handleSave}>
            保存地址
          </button>
        }
      >
        <div className="address-form">
          <div className="form-row">
            <Field label="收货人" required>
              <input type="text" maxLength={12} placeholder="姓名" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </Field>
            <Field label="手机号" required>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="11 位手机号"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
          <div className="region-row">
            <Field label="省" required>
              <input type="text" placeholder="浙江省" value={form.province} onChange={(e) => update('province', e.target.value)} />
            </Field>
            <Field label="市" required>
              <input type="text" placeholder="杭州市" value={form.city} onChange={(e) => update('city', e.target.value)} />
            </Field>
            <Field label="区/县" required>
              <input type="text" placeholder="西湖区" value={form.district} onChange={(e) => update('district', e.target.value)} />
            </Field>
          </div>
          <Field label="详细地址" required hint="街道、门牌号、楼栋房间号等">
            <textarea rows={3} maxLength={80} placeholder="文三路 88 号 3 幢 502 室" value={form.detail} onChange={(e) => update('detail', e.target.value)} />
          </Field>
          <label className="switch-row">
            <span>
              <b>设为默认地址</b>
              <em>实物兑换时优先选择</em>
            </span>
            <button
              type="button"
              className={`switch ${form.isDefault ? 'on' : ''}`}
              onClick={() => update('isDefault', !form.isDefault)}
              aria-label="设为默认地址"
            >
              <span />
            </button>
          </label>
        </div>
      </Sheet>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="删除收货地址"
        description="删除后不可恢复，确定要删除该地址吗？"
        footer={
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
              取消
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              确认删除
            </button>
          </div>
        }
      />
    </div>
  )
}
