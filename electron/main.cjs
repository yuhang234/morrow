const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const isDev = !!process.env.VITE_DEV_SERVER_URL

let win

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 820,
    minWidth: 360,
    minHeight: 560,
    backgroundColor: '#FBF6EE',
    title: 'Morrow',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // 本地桌面应用需要跨域访问 WebDAV 服务器（坚果云等），
      // 关闭 webSecurity 以允许带 Basic 认证的跨域请求。
      webSecurity: false,
      sandbox: false,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})