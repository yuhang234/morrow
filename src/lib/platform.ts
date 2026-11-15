/**
 * 运行环境能力检测。
 *
 * WebDAV 同步需要发送带 Basic 认证的跨域请求：
 * - Electron 桌面版：主进程关闭 webSecurity，可直连。
 * - Android 版：Capacitor 启用 CapacitorHttp，fetch 走原生通道，绕过 CORS。
 * - 纯浏览器 / PWA：受同源策略限制，除非网盘服务器返回 CORS 头，否则会被拦截。
 *   坚果云等主流 WebDAV 服务通常不返回 CORS 头，因此浏览器版同步可能失败。
 */

type DesktopBridge = { isElectron?: boolean; platform?: string }

export function isElectron(): boolean {
  if (typeof window === 'undefined') return false
  const bridge = (window as unknown as { morrowDesktop?: DesktopBridge })
    .morrowDesktop
  return !!bridge?.isElectron
}

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor
  try {
    return !!cap?.isNativePlatform?.()
  } catch {
    return false
  }
}

/** 桌面版 / Android 版：跨域 WebDAV 可直连 */
export function canCrossOriginSync(): boolean {
  return isElectron() || isCapacitorNative()
}

export function platformLabel(): string {
  if (isElectron()) return '桌面版'
  if (isCapacitorNative()) return 'Android 版'
  return '浏览器版'
}