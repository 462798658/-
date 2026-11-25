// Vite 默认输出 <script type="module">，但荣耀等国产 ROM 的 WebView
// 对 ES Modules 支持有诡异 bug（脚本被静默跳过，无任何 error 事件）。
// 本脚本做两件事：
// 1. 把入口脚本改成普通 <script>（去掉 type="module"）
// 2. 把主 <script src="..."> 从 <head> 移到 <body> 里，紧跟 <div id="root"> 之后
//    否则 IIFE 同步执行时 body 还没解析，document.getElementById('root') 返回 null
import fs from 'node:fs'
import path from 'node:path'

const htmlPath = path.resolve('dist/index.html')
if (!fs.existsSync(htmlPath)) {
  console.warn('[fix-html] dist/index.html not found, skipping')
  process.exit(0)
}

let html = fs.readFileSync(htmlPath, 'utf8')

// 1. 去掉 type="module" / crossorigin
html = html.replace(
  /<script\s+type="module"([^>]*)src="([^"]+)"([^>]*)><\/script>/g,
  '<script src="$2"></script>'
)

// 2. 去掉 legacy plugin 注入的额外 type="module" 脚本
html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '')

// 3. 把主 <script src="..."> 从 <head> 里移到 <div id="root"></div> 之后
const mainScriptMatch = html.match(/(<script\s+src="[^"]+"><\/script>)/)
if (mainScriptMatch) {
  const mainScriptTag = mainScriptMatch[1]
  // 从当前位置删掉
  html = html.replace(mainScriptTag, '')
  // 插到 <div id="root"></div> 后面
  html = html.replace(
    /(<div id="root"><\/div>)/,
    '$1\n    ' + mainScriptTag
  )
  console.log('[fix-html] Moved main script to after <div id="root">')
}

fs.writeFileSync(htmlPath, html)
console.log('[fix-html] Patched dist/index.html')
