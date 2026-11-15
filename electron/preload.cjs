// preload 运行在隔离上下文，目前无需暴露额外能力。
// WebDAV 请求由渲染进程直接 fetch（主进程已关闭 webSecurity 以允许跨域带认证）。
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('morrowDesktop', {
  platform: process.platform,
  isElectron: true,
})