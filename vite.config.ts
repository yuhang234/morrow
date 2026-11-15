import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 关闭自动注入注册脚本：Electron 以 file:// 加载页面时无法注册 Service Worker，
      // 改由 src/main.tsx 里按协议手动注册，避免 file:// 下报 "Failed to fetch"。
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Morrow',
        short_name: 'Morrow',
        description: '一次只做一件事，增援未来的自己。',
        theme_color: '#E8893A',
        background_color: '#FBF6EE',
        display: 'standalone',
        start_url: './',
        lang: 'zh-CN',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    // 确保每次构建清空 dist，避免旧哈希产物残留并被一起打进 APK / EXE
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
})
