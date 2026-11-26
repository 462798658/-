import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Sparkles, UserRound } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { ADMIN_ACCOUNT, ADMIN_PASSWORD, DEMO_ACCOUNT, DEMO_PASSWORD } from '../lib/domain'
import { Segmented } from '../components/ui'

const TABS = [
  { value: 'login', label: '账号登录' },
  { value: 'register', label: '注册' },
]

export default function Login() {
  const { user, loginWithAccount, register, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  if (user) return <Navigate to="/" replace />

  const switchTab = (next) => {
    setTab(next)
    setPassword('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result =
      tab === 'login' ? loginWithAccount(account, password) : register({ account, password, nickname })
    if (!result.ok) {
      toast(result.message, 'error')
      return
    }
    toast(tab === 'register' ? '注册成功，欢迎加入学习打卡' : '登录成功，今天也要加油哦', 'success')
    navigate('/', { replace: true })
  }

  const quickLogin = (name, pwd, label) => {
    const result = loginWithAccount(name, pwd)
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
              <UserRound size={18} />
              <input
                type="text"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="请输入账号"
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/\s/g, ''))}
              />
            </label>

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

            <button type="submit" className="btn btn-primary full login-submit">
              {tab === 'register' ? '注册并登录' : '登录'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-tip">
            {tab === 'login'
              ? '使用账号 + 密码登录，学员与管理员均可使用。'
              : '账号需为 3-20 位字母、数字或下划线，注册成功后自动登录，初始积分为 0。'}
          </p>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">
            <span>演示账号</span>
            <em>点击一键登录</em>
          </div>
          <button type="button" className="demo-row" onClick={() => quickLogin(DEMO_ACCOUNT, DEMO_PASSWORD, '学员')}>
            <span className="demo-avatar student">满</span>
            <span className="demo-info">
              <b>学员 · 陈小满</b>
              <i>连续打卡 36 天 · 积分可兑换</i>
            </span>
            <span className="demo-go">
              {DEMO_ACCOUNT}
              <ArrowRight size={14} />
            </span>
          </button>
          <button type="button" className="demo-row" onClick={() => quickLogin(ADMIN_ACCOUNT, ADMIN_PASSWORD, '管理员')}>
            <span className="demo-avatar admin">师</span>
            <span className="demo-info">
              <b>管理员 · 李老师</b>
              <i>规则配置 · 兑换审核</i>
            </span>
            <span className="demo-go">
              {ADMIN_ACCOUNT}
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
        <p className="login-footnote">学习打卡 · 养成好习惯的每一天</p>
      </div>
    </div>
  )
}
