# Morrow

**一次只做一件事，增援未来的自己。**

Morrow 是一个本地优先的反拖延应用。把一件你正在躲的事放进来，分成几小步，每完成一步，橘子就长出一瓣；做完整件，收下一颗完整的橘子。

> Morrow —— 明天与未来。你当下一步，是送给未来的援军。

支持 **Windows 桌面版（EXE）**、**Android 版（APK）** 与 **浏览器 PWA**，数据本地优先，可通过 **WebDAV** 同步到你自己的网盘。

---

## 关于这个名字

Morrow 取意 **「明天 / 未来」**。它延续了同一个核心理念：**一次只做一件事，增援未来的自己**。

项目最初的灵感来自一款名为「只此一橘」的中文产品。那个名字与它「一颗橘子」的意象，如今**保留为本项目的灵感来源与设计寓意**，不再作为正式产品名使用。Morrow 沿用这套专注与成长的隐喻，但代码、界面与实现均为独立开发。详见文末 [设计灵感与致谢](#设计灵感与致谢)。

---

## 一、交付物

| 产物 | 路径 | 说明 |
|---|---|---|
| Windows 安装包 | `release/Morrow-1.0.1-win-x64-setup.exe` | NSIS 安装程序，双击安装，可选安装目录 |
| Windows 免安装版 | `release/win-unpacked/Morrow.exe` | 绿色免安装，直接运行 |
| Android 安装包 | `android/app/build/outputs/apk/debug/app-debug.apk` | 调试签名，可直接安装 |
| 完整源码 | 项目根目录 | React + TypeScript + Vite |
| 使用说明 | 本文件 | — |

---

## 二、功能清单

### 核心（反拖延）

- **只此一件**：同一时间只允许一个进行中任务；完成或体面放下后才能放入下一件。
- **橘子成长**：SVG 绘制的橘子随步骤完成逐瓣生长，完成时播放克制庆祝动画。
- **体面放下**：无法继续时可记录原因暂时放下，不算失败，随时可重新拾起。
- **橘子墙**：收藏已收获 / 已放下的橘子，查看详情。

### 历史记录

- **完整操作日志**：记录 创建 / 完成步骤 / 撤销步骤 / 新增步骤 / 编辑步骤 / 删除步骤 / 完成 / 放下 / 恢复 / 删除 / 同步 / 导入 等动作，含时间戳、任务标题、详情。
- **搜索**：按任务标题与详情实时过滤。
- **筛选**：按操作类型（全部 / 创建 / 完成 / 放下 / 恢复 / 同步）+ 日期范围（起止日期）。
- **查看详情**：点击任意记录展开。
- **恢复历史任务**：
  - 已放下的任务 → 「重新拾起」回到进行中（保留原有进度）。
  - 已完成的任务 → 「再次面对」以原任务为蓝本新建一件（步骤重置为未完成）。
  - 有进行中任务时，上述按钮禁用并提示「先完成当前的事」，维持「只此一件」规则。
- **清空日志**：带二次确认。

### 同步

- **WebDAV 通用支持**：任意标准 WebDAV 服务器 —— 坚果云、Nextcloud、群晖 / 威联通 NAS、自建 SabreDAV 等。
- **多账号**：可同时配置多个网盘 / 服务器，各自独立目录与开关。
- **手动 + 自动同步**：每个账号可单独开启自动同步（编辑后防抖 3 秒触发，同一账号 60 秒内不重复）。
- **冲突处理**：本地与远端都有新改动时不会静默覆盖，弹窗让你选择「保留本地 / 保留远端 / 取消」。
- **连接测试**：保存前可直接测试服务器连通性与账号密码。
- **备份与恢复**：JSON 导出 / 导入（含结构校验与导入前确认），可离线备份。

---

## 三、Windows 版使用

### 安装

1. 双击 `release/Morrow-1.0.1-win-x64-setup.exe`。
2. 选择安装目录（默认当前用户目录，无需管理员权限）。
3. 安装完成后桌面 / 开始菜单会出现「Morrow」快捷方式。

> 未做代码签名，Windows 可能提示「已保护你的电脑」。点击「更多信息」→「仍要运行」即可。

### 免安装

直接运行 `release/win-unpacked/Morrow.exe`。

### 系统要求

Windows 10 / 11（x64），无需安装 Node.js、Java 或任何开发环境。

### 数据位置

Electron 用户数据目录：`%APPDATA%\Morrow\`（localStorage 落在该目录下）。

---

## 四、Android 版使用

### 安装

1. 把 `app-debug.apk` 传到手机（数据线 / 网盘 / 微信文件传输均可）。
2. 点击安装，若提示「未知来源」，在系统设置中允许该来源安装。
3. 桌面出现「Morrow」图标。

应用标识：`com.morrow.app`，最低 Android 7.0（API 24）。

### 适配说明

- 布局为移动优先：360px 起自适应，底部固定导航，内容居中最大 34rem。
- 深色模式跟随系统 / 手动切换。
- 数据存于应用 WebView 的 localStorage，卸载应用会一并清除 —— **重要数据请先导出备份或配置同步**。

### 同步能力

Android 版已启用 Capacitor 原生 HTTP（`CapacitorHttp`），请求走原生通道，可绕过 WebView 的同源策略，能正常访问坚果云等 WebDAV 服务器。
另已放行明文 HTTP（`network_security_config.xml`），以便连接局域网 NAS 的 `http://` WebDAV。

---

## 五、WebDAV 同步配置

### 坚果云（推荐，官方 WebDAV）

1. 登录坚果云网页版 → 右上角头像 → **账户信息** → **安全选项** → **第三方应用管理**。
2. 添加应用，得到**应用密码**（不是登录密码）。
3. 在应用中进入「设置 → 同步 → 添加 WebDAV 账号」：
   - 名称：随意，如「坚果云」
   - 服务器地址：`https://dav.jianguoyun.com/dav/`
   - 用户名：坚果云登录邮箱
   - 密码：**上一步生成的应用密码**
   - 远端目录：默认 `/morrow`
4. 点「测试连接」，成功后保存。

### Nextcloud / 自建 WebDAV

- 服务器地址形如 `https://your-host/remote.php/dav/files/<用户名>/`
- 或任意 WebDAV 根地址，如 `http://192.168.1.10:5005/`
- 远端目录填相对路径（默认 `/morrow`，不存在会自动 MKCOL 创建）

### 同步行为

- 远端文件为 `<远端目录>/data.json`。
- 每次同步先拉取远端，再按「本地是否改动 / 远端是否改动 / 上次同步时间」三方比较决定推送或拉取。
- 两边都变 → 冲突，由你手动选择。
- 远端首次为空 → 直接把本地推上去。

---

## 六、**未实现**的网盘接口（如实标注）

以下网盘**仅通过 OAuth 官方 API 接入才合规**，需要你在各自开放平台注册应用、拿到 Client ID / Secret，且回调地址必须是对外可访问的域名。本项目**没有实现**这些接口，应用内也明确标注：

- **OneDrive**（Microsoft Graph API）— 未实现
- **Google Drive**（Google Drive API）— 未实现
- **Dropbox**（Dropbox API v2）— 未实现
- **阿里云盘**（阿里云盘开放平台）— 未实现
- **百度网盘**（百度网盘开放平台）— 未实现

**说明**：这些服务均**不提供**标准 WebDAV 服务，因此无法用本应用的 WebDAV 通道同步。若需要，需自行申请 OAuth 凭据并在 `src/sync/` 下扩展适配层。

可选变通：同步到支持 WebDAV 的中转服务（自建 Nextcloud / NAS），再由该服务与上述网盘做二次同步。

---

## 七、浏览器版说明

- `npm run dev` / `npm run preview` 打开的是浏览器版，功能与桌面版一致，但 **WebDAV 同步受同源策略限制**：坚果云等服务器不返回 CORS 头，浏览器会拦截请求。
- 应用会在设置页检测运行环境并给出提示。
- 需要同步请使用 Windows 桌面版或 Android 版。

---

## 八、从源码构建

### 环境要求

| 用途 | 需要 |
|---|---|
| Web / 开发 | Node.js 18+ |
| Windows EXE | 上述 + 首次打包需联网下载 Electron 二进制 |
| Android APK | JDK **21**、Android SDK（platform 34 / build-tools 34） |

### 常用命令

```bash
# 安装依赖
npm install

# 开发（浏览器，http://localhost:5173）
npm run dev

# 构建 web 产物到 dist/
npm run build

# 生成 PWA 图标 + Android 图标
npm run icons

# Windows：打包安装程序到 release/
npx electron-builder --win

# Windows：直接运行桌面版（读取 dist/）
npx electron .

# Android：同步 web 产物到原生工程
npx cap copy android

# Android：构建 APK
cd android
./gradlew assembleDebug          # Windows: .\gradlew.bat assembleDebug
```

### Android 构建的环境变量

```powershell
$env:JAVA_HOME='D:\JDK21\jdk-21.0.13+9'
$env:ANDROID_HOME='D:\AndroidSDK'
$env:ANDROID_SDK_ROOT='D:\AndroidSDK'
```

`android/local.properties` 中需指定 `sdk.dir`（本项目已写入 `D:/AndroidSDK`，换机器请修改）。

### 国内网络下的 Electron 打包

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
npx electron-builder --win
```

---

## 九、发布到你自己的 GitHub

本仓库尚未绑定远程地址，仓库名建议统一为 **`morrow`**。首次发布：

```bash
git init
git add .
git commit -m "chore: rename project to Morrow"
git branch -M main
git remote add origin https://github.com/<你的用户名>/morrow.git
git push -u origin main
```

若要部署为网页版（GitHub Pages），执行 `npm run build` 后把 `dist/` 发布到 Pages 即可；构建产物使用相对路径，可直接部署在 `https://<用户名>.github.io/morrow/` 子路径下。

> 提示：本项目所在目录目前仍叫「只此一橘」。如需彻底统一，可在关闭所有占用该目录的程序后重命名文件夹：
> ```powershell
> Rename-Item 'D:\AData\dev\study\只此一橘' 'morrow'
> ```

---

## 十、项目结构

```
morrow/
├─ electron/
│  ├─ main.cjs              # Electron 主进程（窗口、关闭 webSecurity 以支持 WebDAV）
│  └─ preload.cjs           # 暴露 morrowDesktop 桥接标识
├─ android/                 # Capacitor Android 原生工程（com.morrow.app）
│  ├─ app/src/main/java/com/morrow/app/MainActivity.java
│  ├─ app/src/main/res/     # 各密度图标（由 scripts/gen-icons.mjs 生成）
│  └─ local.properties      # sdk.dir
├─ scripts/gen-icons.mjs    # SVG → PNG（PWA + Android 各密度）
├─ public/
│  ├─ favicon.svg
│  └─ icon-192.png / icon-512.png
├─ src/
│  ├─ App.tsx               # 导航 / 主题 / 引导 / 庆祝触发
│  ├─ store.ts              # 状态管理、审计日志、同步调度、旧数据迁移
│  ├─ types.ts              # Task / Step / AuditEvent / SyncAccount
│  ├─ sync/webdav.ts        # WebDAV 测试 / 推送 / 拉取
│  ├─ lib/format.ts         # 日期格式化
│  ├─ lib/platform.ts       # 运行环境检测（Electron / Capacitor / 浏览器）
│  ├─ lib/pwa.ts            # Service Worker 注册（仅 http/https）
│  └─ components/
│     ├─ Orange.tsx         # 橘子可视化
│     ├─ Home.tsx           # 空状态 / 进行中 / 步骤列表
│     ├─ CreateTask.tsx     # 创建任务
│     ├─ ReleaseTask.tsx    # 体面放下
│     ├─ Completion.tsx     # 完成庆祝
│     ├─ Collection.tsx     # 橘子墙
│     ├─ History.tsx        # 历史记录
│     ├─ Settings.tsx       # 外观 / 数据 / 同步
│     ├─ Onboarding.tsx     # 首次引导
│     └─ Modal.tsx          # 通用模态
├─ capacitor.config.ts
├─ vite.config.ts
├─ tailwind.config.js
└─ package.json
```

---

## 十一、数据与安全

### 存储位置

- 浏览器 / Electron / Android：localStorage，键名 `morrow:data:v1`
- Electron 用户数据目录：`%APPDATA%\Morrow\`
- Android 应用数据：应用私有目录，卸载即清除

> **从旧版本升级**：若本地存在更名前的旧键 `zhiyi-ju:data:v1`，Morrow 首次启动会自动迁移到新键，旧键保留不删，避免迁移过程意外丢数据。

### 数据结构

```jsonc
{
  "version": 1,
  "updatedAt": 0,              // 每次改动刷新，用于同步冲突判定
  "tasks": [
    {
      "id": "...", "title": "...", "why": "...",
      "steps": [{ "id": "...", "title": "...", "done": false, "completedAt": 0 }],
      "status": "active",       // active | completed | released
      "createdAt": 0, "completedAt": 0, "releasedAt": 0,
      "releaseReason": "..."
    }
  ],
  "audit": [
    { "id": "...", "at": 0, "action": "create", "taskId": "...", "taskTitle": "...", "detail": "..." }
  ],
  "settings": {
    "theme": "light",           // light | dark
    "onboarded": true,
    "syncAccounts": [
      { "id": "...", "name": "...", "url": "...", "username": "...",
        "password": "...", "path": "/morrow", "autoSync": false,
        "lastSyncAt": 0, "lastError": "" }
    ]
  }
}
```

### 安全提示（务必阅读）

- **全部数据仅存于本设备**，不经过任何第三方服务器。
- **WebDAV 账号密码以明文形式保存在本地 localStorage**，未加密。如果设备可能被他人使用，建议：
  - 使用网盘提供的**应用专用密码**（如坚果云应用密码），不要用主账号密码；
  - 或把远端目录设为私有，并定期更换应用密码。
- 导出 JSON 备份时，文件同样包含账号密码 —— 分享前请删除 `settings.syncAccounts` 字段。
- Electron 版为了能访问任意 WebDAV 服务器，关闭了 `webSecurity`。应用只加载本地打包的页面，不加载任何远程网页，风险可控。

---

## 十二、已验证项

- 类型检查 `npx tsc --noEmit` 通过。
- 生产构建 `npm run build` 成功，PWA service worker 生成。
- Windows 安装包构建成功，`win-unpacked/Morrow.exe` 可直接启动，窗口标题为 `Morrow`。
- Android APK 构建成功，包名 `com.morrow.app`，应用显示名 `Morrow`。
- 浏览器实测：引导 → 空状态 → 创建任务 → 完成步骤 → 庆祝 → 橘子墙 → 历史（搜索 / 筛选 / 恢复）→ 设置（主题 / 导入导出 / 同步表单）全流程可用。
- 刷新页面数据不丢失；更名后的旧数据迁移逻辑已生效。
- 深色 / 浅色模式均正常。

## 十三、未验证项（如实说明）

- **WebDAV 同步未做真实服务器联调**：开发环境没有可用的坚果云 / Nextcloud 账号，代码按 WebDAV 标准（PROPFIND / MKCOL / PUT / GET + Basic Auth）实现，但未与真实服务器端到端跑通。
- **自动同步、冲突弹窗未做真实双端验证**：仅通过代码路径与类型检查确认，未有第二台设备参与测试。
- 未在真机 Android 上安装运行验证（仅确认 APK 构建成功与包结构正确）。
- Electron 桌面版已构建并确认渲染，但其内部交互未做自动化回归。

建议首次使用同步时，先点「测试连接」确认账号可用，再手动同步一次，确认网盘上出现 `morrow/data.json`。

---

## 设计灵感与致谢

Morrow 的产品理念源于知乎作者 **Gavin** 的「只此一橘」。

原文链接：<https://www.zhihu.com/question/27064371/answer/2102545472963585918>

具体借鉴的思想包括：

- **单任务专注** —— 一次只面对一件事，做完或体面放下，才能放入下一件；
- **橘子成长机制** —— 一件事是一颗橘子，拆成若干橘瓣，每完成一步长出一瓣，做完整件才收下一颗完整的橘子；
- **「增援未来」** —— 当下的每一个细小行动，都是在增援未来的自己。

**声明**：

- Morrow 是**独立开发的开源项目**，与原作者 Gavin、以及原产品「只此一橘」**没有任何官方关联**，未获得其授权、认可或背书。
- 本项目**尊重原创**：不复制、不使用原作者的**商标、名称、图标、界面素材与源代码**。Morrow 的代码、界面布局、视觉素材（含橘子图形）均为本项目自行实现；「只此一橘」四字仅作为灵感来源在设计说明与致谢中被提及，不作为本产品名称。
- 若你打算将本项目用于商业用途，请自行确认与原作品相关的合规事宜。

**特别感谢** Gavin 公开分享的产品思考 —— 它让「开始行动」这件事，有了一个温柔的形状。

---

## 设计原则

不打卡、不羞辱、不倒计时。产品的优势是简单，而不是功能堆砌。明确不做：AI 拆解、聊天、社交、排行榜、积分、日历、多任务看板、统计、频繁通知、账号云同步。