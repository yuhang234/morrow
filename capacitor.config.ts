import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.morrow.app',
  appName: 'Morrow',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    // 启用原生 HTTP，让 fetch 走原生通道，
    // 绕过 WebView 的跨域限制，才能访问坚果云等 WebDAV 服务器。
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config