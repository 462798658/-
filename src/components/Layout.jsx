import React, { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, NotebookPen, Coins, Gift, User } from 'lucide-react'

const tabs = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/checkin', label: '打卡', icon: NotebookPen },
  { to: '/points', label: '积分', icon: Coins },
  { to: '/shop', label: '商城', icon: Gift },
  { to: '/profile', label: '我的', icon: User },
]

export default function Layout() {
  const location = useLocation()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [location.pathname])

  const isTab = tabs.some((t) => t.to === location.pathname)

  return (
    <div className="app-frame">
      <main className={`app-scroll ${isTab ? 'with-nav' : 'no-nav'}`} ref={scrollRef}>
        <div key={location.pathname} className="page">
          <Outlet />
        </div>
      </main>
      {isTab ? (
        <nav className="bottom-nav">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">
                <Icon size={20} strokeWidth={2.1} />
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
