/**
 * PWA Service Worker 注册。
 *
 * 仅在 http(s) 下注册：
 * Electron 以 file:// 协议加载打包页面，该协议不支持 Service Worker，
 * 盲目注册会产生 "Uncaught (in promise) TypeError: Failed to fetch" 报错。
 * 浏览器 / PWA 场景仍照常注册，保留离线能力。
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const proto = window.location.protocol
  if (proto !== 'http:' && proto !== 'https:') return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 注册失败不影响应用使用（例如某些内嵌浏览器环境）
    })
  })
}