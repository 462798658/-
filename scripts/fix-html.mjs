// Vite 默认输出 <script type="module">，但荣耀等国产 ROM 的 WebView
// 对 ES Modules 支持有诡异 bug（脚本被静默跳过，无任何 error 事件）。
// 本脚本把入口脚本改成普通 <script>，确保所有 WebView 统一执行。
import fs from 'node:fs'
import path from 'node:path'

const htmlPath = path.resolve('dist/index.html')
if (!fs.existsSync(htmlPath)) {
  console.warn('[fix-html] dist/index.html not found, skipping')
  process.exit(0)
}

let html = fs.readFileSync(htmlPath, 'utf8')

// 去掉 type="module" / crossorigin，改成普通 script
html = html.replace(
  /<script\s+type="module"([^>]*)src="([^"]+)"([^>]*)><\/script>/g,
  '<script src="$2"></script>'
)

// 去掉 legacy plugin 注入的额外 type="module" 脚本（如果有）
html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '')

fs.writeFileSync(htmlPath, html)
console.log('[fix-html] Patched dist/index.html to use plain <script> tags')
