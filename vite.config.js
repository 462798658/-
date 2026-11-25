import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // 强制输出 IIFE 格式，所有浏览器（含荣耀等国产 ROM）统一加载
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        // IIFE 入口命名
        globals: {},
      },
    },
    // 目标 ES5，最大化兼容性
    target: 'es2017',
    minify: 'terser',
  },
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
})
