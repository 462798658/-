import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { ADMIN_PASSWORD, ADMIN_PHONE, DEMO_PASSWORD, DEMO_PHONE } from '../lib/domain'
import { Segmented } from '../components/ui'

const TABS = [
  { value: 'code', label: '验证码登录' },
  { value: 'password', label: '密码登录' },
  { value: 'register', label: '注册' },
]

export default function Login() {
  const { user, loginWithCode, loginWithPassword, register, sendCode, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('code')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  if (user) return <Navigate to="/" replace />

  const switchTab = (next) => {
    setTab(next)
    setCode('')
    setPassword('')
  }

  const handleSendCode = () => {
    const result = sendCode(phone)
    if (!result.ok) {
      toast(result.message, 'error')
      return
    }
    setCode(result.code)
    setCountdown(60)
    toast(`验证码已发送（演示已自动填入）：${result.code}`, 'success')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    let result
    if (tab === 'code') result = loginWithCode(phone, code)
    else if (tab === 'password') result = loginWithPassword(phone, password)
    else result = register({ phone, code, password, nickname })
    if (!result.ok) {
      toast(result.message, 'error')
      return
    }
    toast(tab === 'register' ? '注册成功，欢迎加入学习打卡' : '登录成功，今天也要加油哦', 'success')
    navigate('/', { replace: true })
  }

  const quickLogin = (p, pwd, label) => {
    const result = loginWithPassword(p, pwd)
    if (!result.ok) {
      toast(result.message, 'error')
      return
    }
    toast(`${label}账号登录成功`, 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="login-screen">
      <div className="login-orb orb-a" />
      <div className="login-orb orb-b" />
      <div className="login-grid" />
      <div className="login-inner">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={26} strokeWidth={2} />
          </div>
          <div className="brand-text">
            <h1>学习打卡</h1>
            <p>让每一次坚持，都看得见</p>
          </div>
        </div>

        <div className="login-quote">
          <Sparkles size={14} />
          <span>阅读 30 分钟 · 计算作业打卡 · 积分兑换好礼</span>
        </div>

        <div className="login-card">
          <Segmented options={TABS} value={tab} onChange={switchTab} className="login-tabs" />
          <form onSubmit={handleSubmit} className="login-form">
            <label className="input-group">
              <Phone size={18} />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </label>

            {tab !== 'password' ? (
              <div className="input-group with-action">
                <ShieldCheck size={18} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <button type="button" className="code-btn" disabled={countdown > 0} onClick={handleSendCode}>
                  {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                </button>
              </div>
            ) : null}

            {tab === 'register' ? (
              <label className="input-group">
                <UserRound size={18} />
                <input
                  type="text"
                  maxLength={12}
                  placeholder="给自己起个昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </label>
            ) : null}

            {tab !== 'code' ? (
              <label className="input-group with-action">
                <LockKeyhole size={18} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder={tab === 'register' ? '设置登录密码（至少 6 位）' : '请输入登录密码'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </label>
            ) : null}

            <button type="submit" className="btn btn-primary full login-submit">
              {tab === 'register' ? '注册并登录' : '登录'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-tip">
            {tab === 'code'
              ? '未注册的手机号请先切换到「注册」，注册时设置登录密码。'
              : tab === 'password'
                ? '学员与管理员均可使用手机号 + 密码登录。'
                : '注册成功后自动登录，初始积分为 0。'}
          </p>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">
            <span>演示账号</span>
            <em>点击一键登录</em>
          </div>
          <button type="button" className="demo-row" onClick={() => quickLogin(DEMO_PHONE, DEMO_PASSWORD, '学员')}>
            <span className="demo-avatar student">满</span>
            <span className="demo-info">
              <b>学员 · 陈小满</b>
              <i>连续打卡 36 天 · 积分可兑换</i>
            </span>
            <span className="demo-go">
              {DEMO_PHONE}
              <ArrowRight size={14} />
            </span>
          </button>
          <button type="button" className="demo-row" onClick={() => quickLogin(ADMIN_PHONE, ADMIN_PASSWORD, '管理员')}>
            <span className="demo-avatar admin">师</span>
            <span className="demo-info">
              <b>管理员 · 李老师</b>
              <i>规则配置 · 兑换审核</i>
            </span>
            <span className="demo-go">
              {ADMIN_PHONE}
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
        <p className="login-footnote">学习打卡 · 养成好习惯的每一天</p>
      </div>
    </div>
  )
}
