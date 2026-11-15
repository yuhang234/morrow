import { useRef, useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
  Plus,
  Pencil,
} from 'lucide-react'
import { Modal } from './Modal'
import { store, useStore } from '../store'
import type { ThemeMode, SyncAccount } from '../types'
import { canCrossOriginSync, platformLabel } from '../lib/platform'

type Props = {
  theme: ThemeMode
  historyCount: number
}

export function Settings({ theme, historyCount }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{
    ok: boolean
    msg: string
  } | null>(null)
  const [importPreview, setImportPreview] = useState<{
    name: string
    content: string
    count: number
  } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const data = useStore()
  const accounts = data.settings.syncAccounts
  const [syncForm, setSyncForm] = useState<{
    mode: 'add' | 'edit'
    id?: string
    name: string
    url: string
    username: string
    password: string
    path: string
    autoSync: boolean
  } | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)

  function flashToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 2600)
  }
  function openAddSync() {
    setTestResult(null)
    setSyncForm({
      mode: 'add',
      name: '',
      url: 'https://dav.jianguoyun.com/dav/',
      username: '',
      password: '',
      path: '/morrow',
      autoSync: false,
    })
  }

  function openEditSync(acc: SyncAccount) {
    setTestResult(null)
    setSyncForm({
      mode: 'edit',
      id: acc.id,
      name: acc.name,
      url: acc.url,
      username: acc.username,
      password: acc.password,
      path: acc.path,
      autoSync: acc.autoSync,
    })
  }

  async function handleTest() {
    if (!syncForm) return
    setTesting(true)
    setTestResult(null)
    const res = await store.testSyncAccount({
      id: syncForm.id ?? 'tmp',
      name: syncForm.name,
      url: syncForm.url,
      username: syncForm.username,
      password: syncForm.password,
      path: syncForm.path,
      autoSync: syncForm.autoSync,
    })
    setTesting(false)
    setTestResult({
      ok: res.ok,
      msg: res.ok ? '连接成功' : res.error ?? '连接失败',
    })
  }

  function saveSyncForm() {
    if (!syncForm) return
    if (!syncForm.name.trim() || !syncForm.url.trim()) {
      flashToast(false, '请填写名称与服务器地址')
      return
    }
    if (syncForm.mode === 'add') {
      store.addSyncAccount({
        name: syncForm.name.trim(),
        url: syncForm.url.trim(),
        username: syncForm.username,
        password: syncForm.password,
        path: syncForm.path || '/morrow',
        autoSync: syncForm.autoSync,
      })
      flashToast(true, '已添加账号')
    } else if (syncForm.id) {
      store.updateSyncAccount(syncForm.id, {
        name: syncForm.name.trim(),
        url: syncForm.url.trim(),
        username: syncForm.username,
        password: syncForm.password,
        path: syncForm.path || '/morrow',
        autoSync: syncForm.autoSync,
      })
      flashToast(true, '已更新账号')
    }
    setSyncForm(null)
  }

  async function handleSyncNow(id: string) {
    setSyncingId(id)
    const res = await store.syncNow(id)
    setSyncingId(null)
    if (!res.ok && res.message.includes('冲突')) {
      setConflict(id)
    } else {
      flashToast(res.ok, res.message)
    }
  }

  async function handleResolve(choice: 'local' | 'remote') {
    if (!conflict) return
    const res = await store.resolveConflict(conflict, choice)
    setConflict(null)
    flashToast(res.ok, res.message)
  }

  function handleExport() {
    const data = store.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}${String(d.getDate()).padStart(2, '0')}`
    a.href = url
    a.download = `morrow-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    flashToast(true, '已导出备份文件')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? '')
      // quick validate count
      try {
        const parsed = JSON.parse(content)
        const count = Array.isArray(parsed?.tasks) ? parsed.tasks.length : 0
        setImportPreview({ name: file.name, content, count })
      } catch {
        flashToast(false, '文件不是有效的 JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    if (!importPreview) return
    const res = store.importData(importPreview.content)
    if (res.ok) {
      flashToast(true, `已导入 ${res.replaced} 条记录`)
    } else {
      flashToast(false, res.error ?? '导入失败')
    }
    setImportPreview(null)
  }

  return (
    <div className="px-5 sm:px-6 pt-6 pb-32 max-w-reading mx-auto">
      <h1 className="text-lg font-medium text-ink-900 dark:text-cream-100">
        设置
      </h1>

      <section className="mt-6">
        <p className="text-xs text-ink-300 dark:text-ink-500 mb-2">外观</p>
        <div className="rounded-2xl bg-white dark:bg-night-800 border border-cream-200/70 dark:border-night-700 divide-y divide-cream-200/60 dark:divide-night-700/60">
          <button
            onClick={() => store.toggleTheme()}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors"
          >
            <span className="flex items-center gap-3 text-sm text-ink-900 dark:text-cream-100">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              深色模式
            </span>
            <span
              className={`relative w-10 h-6 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-orange-peel' : 'bg-cream-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-xs text-ink-300 dark:text-ink-500 mb-2">数据</p>
        <div className="rounded-2xl bg-white dark:bg-night-800 border border-cream-200/70 dark:border-night-700 divide-y divide-cream-200/60 dark:divide-night-700/60">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-ink-900 dark:text-cream-100 hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors"
          >
            <Download size={16} className="text-cobalt" />
            导出 JSON 备份
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-ink-900 dark:text-cream-100 hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors"
          >
            <Upload size={16} className="text-cobalt" />
            从 JSON 导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => setConfirmClear(true)}
            disabled={historyCount === 0}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-ink-500 dark:text-ink-300 hover:text-orange-deep transition-colors disabled:opacity-40"
          >
            <Trash2 size={16} />
            清空历史记录（{historyCount} 条）
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-300 dark:text-ink-500 leading-relaxed">
          所有数据默认仅保存在本设备浏览器中；开启下方 WebDAV 同步后，可备份到你自己的网盘。导入会覆盖现有记录，请先导出备份。
        </p>
      </section>

      <section className="mt-6">
        <p className="text-xs text-ink-300 dark:text-ink-500 mb-2">同步</p>
        <div className="rounded-2xl bg-white dark:bg-night-800 border border-cream-200/70 dark:border-night-700 divide-y divide-cream-200/60 dark:divide-night-700/60">
          {accounts.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <CloudOff size={20} className="mx-auto text-ink-300 dark:text-ink-500" />
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">
                还没有配置 WebDAV 账号
              </p>
            </div>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {acc.autoSync ? (
                        <Cloud size={15} className="text-cobalt shrink-0" />
                      ) : (
                        <CloudOff size={15} className="text-ink-300 dark:text-ink-500 shrink-0" />
                      )}
                      <span className="text-sm text-ink-900 dark:text-cream-100 truncate">
                        {acc.name}
                      </span>
                      {acc.autoSync && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cobalt/10 text-cobalt">
                          自动
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink-300 dark:text-ink-500 truncate">
                      {acc.url}
                    </p>
                    {acc.lastSyncAt ? (
                      <p className="mt-0.5 text-[11px] text-ink-300 dark:text-ink-500">
                        上次同步：{new Date(acc.lastSyncAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-ink-300 dark:text-ink-500">
                        尚未同步
                      </p>
                    )}
                    {acc.lastError && (
                      <p className="mt-0.5 text-[11px] text-orange-deep">
                        {acc.lastError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleSyncNow(acc.id)}
                    disabled={syncingId === acc.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-orange-peel text-white px-3 py-1.5 text-[11px] font-medium hover:bg-orange-deep transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={syncingId === acc.id ? 'animate-spin' : ''} />
                    {syncingId === acc.id ? '同步中…' : '立即同步'}
                  </button>
                  <button
                    onClick={() => openEditSync(acc)}
                    className="inline-flex items-center gap-1 rounded-lg border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 px-3 py-1.5 text-[11px] hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors"
                  >
                    <Pencil size={12} />
                    编辑
                  </button>
                  <button
                    onClick={() => store.deleteSyncAccount(acc.id)}
                    className="inline-flex items-center gap-1 rounded-lg text-ink-500 dark:text-ink-300 hover:text-orange-deep px-2 py-1.5 text-[11px] transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={openAddSync}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-cobalt hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors"
          >
            <Plus size={16} />
            添加 WebDAV 账号
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-300 dark:text-ink-500 leading-relaxed">
          坚果云请使用应用密码；其它 WebDAV 服务器（Nextcloud、自建等）同样支持。
        </p>

        {!canCrossOriginSync() && (
          <div className="mt-3 rounded-xl bg-orange-soft/25 dark:bg-orange-deep/15 border border-orange-soft/50 dark:border-orange-deep/30 px-4 py-3">
            <p className="text-[11px] text-ink-700 dark:text-cream-200 leading-relaxed">
              当前为{platformLabel()}：浏览器出于跨域安全限制，通常无法直接访问坚果云等
              WebDAV 服务器。同步功能请在 Windows 桌面版或 Android 版中使用。
            </p>
          </div>
        )}

        <div className="mt-3 rounded-xl bg-cream-200/50 dark:bg-night-700/40 border border-cream-300/60 dark:border-night-700 px-4 py-3">
          <p className="text-[11px] text-ink-500 dark:text-ink-300 leading-relaxed">
            官方 OAuth 网盘（OneDrive / Google Drive / Dropbox / 阿里云盘 / 百度网盘）暂未实现，需各自申请 OAuth 应用凭据后接入。本次仅实现 WebDAV（含坚果云）。
          </p>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-xs text-ink-300 dark:text-ink-500 leading-relaxed text-center">
          Morrow · 增援未来
        </p>
      </section>

      {/* import confirm */}
      <Modal
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        title="确认导入"
      >
        {importPreview && (
          <div className="space-y-4">
            <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
              将从 <span className="font-medium">{importPreview.name}</span>{' '}
              导入 <span className="font-medium">{importPreview.count}</span>{' '}
              条记录，并覆盖当前所有数据。
            </p>
            <p className="text-xs text-ink-300 dark:text-ink-500">
              此操作无法撤销。建议先导出当前备份。
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setImportPreview(null)}
                className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-2.5 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 rounded-xl bg-orange-peel text-white py-2.5 text-sm font-medium hover:bg-orange-deep transition-colors"
              >
                覆盖并导入
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* clear confirm */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="清空历史记录？"
      >
        <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
          将删除所有已收获和已放下的橘子（{historyCount} 条），只保留当前进行中的事。此操作无法撤销。
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setConfirmClear(false)}
            className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-2.5 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              store.clearHistory()
              setConfirmClear(false)
              flashToast(true, '历史记录已清空')
            }}
            className="flex-1 rounded-xl bg-orange-deep text-white py-2.5 text-sm font-medium hover:bg-orange-peel transition-colors"
          >
            清空
          </button>
        </div>
      </Modal>

      {/* sync form */}
      <Modal
        open={!!syncForm}
        onClose={() => setSyncForm(null)}
        title={syncForm?.mode === 'edit' ? '编辑 WebDAV 账号' : '添加 WebDAV 账号'}
      >
        {syncForm && (
          <div className="space-y-3">
            <Field label="名称">
              <input
                value={syncForm.name}
                onChange={(e) => setSyncForm({ ...syncForm, name: e.target.value })}
                placeholder="如：我的坚果云"
                className="w-full text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none"
              />
            </Field>
            <Field label="服务器地址">
              <input
                value={syncForm.url}
                onChange={(e) => setSyncForm({ ...syncForm, url: e.target.value })}
                placeholder="https://dav.jianguoyun.com/dav/"
                className="w-full text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none"
              />
            </Field>
            <Field label="用户名">
              <input
                value={syncForm.username}
                onChange={(e) => setSyncForm({ ...syncForm, username: e.target.value })}
                className="w-full text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 focus:border-orange-peel focus:outline-none"
              />
            </Field>
            <Field label="密码 / 应用密码">
              <input
                type="password"
                value={syncForm.password}
                onChange={(e) => setSyncForm({ ...syncForm, password: e.target.value })}
                className="w-full text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 focus:border-orange-peel focus:outline-none"
              />
            </Field>
            <Field label="远端目录">
              <input
                value={syncForm.path}
                onChange={(e) => setSyncForm({ ...syncForm, path: e.target.value })}
                placeholder="/morrow"
                className="w-full text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none"
              />
            </Field>
            <button
              onClick={() => setSyncForm({ ...syncForm, autoSync: !syncForm.autoSync })}
              className="w-full flex items-center justify-between px-1 py-1"
            >
              <span className="text-sm text-ink-900 dark:text-cream-100">自动同步</span>
              <span
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  syncForm.autoSync ? 'bg-orange-peel' : 'bg-cream-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    syncForm.autoSync ? 'translate-x-4' : ''
                  }`}
                />
              </span>
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 px-4 py-2.5 text-sm hover:bg-cream-50 dark:hover:bg-night-700/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
                测试连接
              </button>
              {testResult && (
                <span
                  className={`text-xs ${testResult.ok ? 'text-cobalt' : 'text-orange-deep'}`}
                >
                  {testResult.msg}
                </span>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSyncForm(null)}
                className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-2.5 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveSyncForm}
                className="flex-1 rounded-xl bg-orange-peel text-white py-2.5 text-sm font-medium hover:bg-orange-deep transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* conflict resolve */}
      <Modal
        open={!!conflict}
        onClose={() => setConflict(null)}
        title="同步冲突"
        closeOnBackdrop={false}
      >
        <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
          本地与远端都有新的改动，请选择保留哪一份。未选中的那份将丢失。
        </p>
        <div className="flex flex-col gap-2 mt-5">
          <button
            onClick={() => handleResolve('local')}
            className="w-full rounded-xl bg-orange-peel text-white py-2.5 text-sm font-medium hover:bg-orange-deep transition-colors"
          >
            保留本地（上传到远端）
          </button>
          <button
            onClick={() => handleResolve('remote')}
            className="w-full rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-2.5 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
          >
            保留远端（覆盖本地）
          </button>
          <button
            onClick={() => setConflict(null)}
            className="w-full rounded-xl text-ink-500 dark:text-ink-300 py-2.5 text-sm hover:text-ink-900 dark:hover:text-cream-100 transition-colors"
          >
            取消
          </button>
        </div>
      </Modal>
      {/* toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[70] animate-[floaty_0.3s_ease]">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs shadow-soft ${
              toast.ok
                ? 'bg-orange-peel text-white'
                : 'bg-night-700 text-cream-100'
            }`}
          >
            {toast.ok && <Check size={14} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-ink-300 dark:text-ink-500 mb-1">{label}</p>
      {children}
    </div>
  )
}
