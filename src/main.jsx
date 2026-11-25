import React, { Component, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// 全局错误收集器
const errorStore = []
window.__appErrors = errorStore

window.addEventListener('error', (e) => {
  const info = `[ERROR] ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`
  console.error(info, e.error || e)
  errorStore.push(info)
  // 通知 HTML 探针更新显示
  try { window.__probe && window.__probe.show() } catch (_) {}
})

window.addEventListener('unhandledrejection', (e) => {
  const info = `[PROMISE] ${e.reason?.message || e.reason}`
  console.error(info)
  errorStore.push(info)
  try { window.__probe && window.__probe.show() } catch (_) {}
})

console.log('[ENV] userAgent:', navigator.userAgent)
console.log('[ENV] location:', location.href)
console.log('[ENV] localStorage:', typeof localStorage)
console.log('[ENV] indexedDB:', typeof indexedDB)

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, stack: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ stack: info.componentStack })
    console.error('[ErrorBoundary]', error, info)
    try { window.__probe && window.__probe.show() } catch (_) {}
  }
  render() {
    if (!this.state.error) return this.props.children
    const err = this.state.error
    const stack = this.state.stack
    return (
      <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 13, color: '#c00', background: '#fff5f5', minHeight: '100vh' }}>
        <h2 style={{ color: '#c00' }}>应用加载出错</h2>
        <p><b>消息：</b>{err?.message || String(err)}</p>
        <p><b>文件名：</b>{err?.fileName || '?'}</p>
        <p><b>行/列：</b>{err?.lineNumber || '?'} / {err?.columnNumber || '?'}</p>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer' }}>查看堆栈</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{err?.stack || '(无)'}</pre>
        </details>
        {stack ? (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer' }}>组件堆栈</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{stack}</pre>
          </details>
        ) : null}
        <p style={{ marginTop: 16, color: '#666' }}>请截图此页面发给开发者</p>
      </div>
    )
  }
}

try {
  const root = createRoot(document.getElementById('root'))
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
  // React 成功挂载，隐藏 HTML 原生探针
  setTimeout(() => {
    try { window.__probe && window.__probe.hide() } catch (_) {}
  }, 500)
} catch (fatal) {
  console.error('[FATAL] React mount failed:', fatal)
  errorStore.push('[FATAL] ' + (fatal?.message || fatal))
  // 让 HTML 探针显示
  try { window.__probe && window.__probe.show() } catch (_) {}
  // 同时也在 root 里放兜底
  document.getElementById('root').innerHTML = `
    <div style="padding:20px;font-family:monospace;color:#c00;background:#fff5f5;min-height:100vh;">
      <h2>React 挂载失败</h2>
      <p>${fatal?.message || fatal}</p>
      <pre>${fatal?.stack || ''}</pre>
    </div>
  `
}
