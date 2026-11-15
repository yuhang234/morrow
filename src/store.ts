import { useSyncExternalStore } from 'react'
import type {
  AppData,
  Task,
  Step,
  ThemeMode,
  AuditAction,
  AuditEvent,
  SyncAccount,
} from './types'
import { DATA_VERSION } from './types'
import { webdavPull, webdavPush, webdavTest } from './sync/webdav'

// Morrow 的存储键。更名前的旧键保留用于一次性数据迁移。
const STORAGE_KEY = 'morrow:data:v1'
const LEGACY_STORAGE_KEY = 'zhiyi-ju:data:v1'

function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    tasks: [],
    settings: {
      theme: prefersDark() ? 'dark' : 'light',
      onboarded: false,
      syncAccounts: [],
    },
    updatedAt: 0,
    audit: [],
  }
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function load(): AppData {
  try {
    // 若新键为空但存在旧键（更名前的「只此一橘」数据），自动迁移过来。
    const needsMigration = localStorage.getItem(STORAGE_KEY) === null
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || typeof parsed !== 'object') return emptyData()
    if (!Array.isArray(parsed.tasks)) parsed.tasks = []
    if (!parsed.settings) parsed.settings = emptyData().settings
    if (!parsed.settings.syncAccounts)
      parsed.settings.syncAccounts = []
    if (typeof parsed.updatedAt !== 'number') parsed.updatedAt = 0
    if (!Array.isArray(parsed.audit)) parsed.audit = []
    // normalize steps
    for (const t of parsed.tasks) {
      if (!Array.isArray(t.steps)) t.steps = []
      for (const s of t.steps) {
        if (typeof s.done !== 'boolean') s.done = false
      }
    }
    if (needsMigration) {
      // 旧键保留不删，避免迁移过程中意外丢数据。
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
    return parsed
  } catch {
    return emptyData()
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

let state: AppData = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

// auto-sync bookkeeping
let _syncing = false
let _autoTimer: ReturnType<typeof setTimeout> | null = null
// 最近一次 pull 到的远端字符串，供冲突解决使用
let lastRemote: { accountId: string; json: string } | null = null

function emit() {
  state.updatedAt = Date.now()
  persist()
  for (const l of listeners) l()
  scheduleAutoSync()
}

function scheduleAutoSync() {
  if (_syncing) return
  const accounts = state.settings.syncAccounts
  const now = Date.now()
  const due = accounts.some(
    (a) => a.autoSync && (a.lastSyncAt ?? 0) + 60000 < now,
  )
  if (!due) return
  if (_autoTimer) return
  _autoTimer = setTimeout(() => {
    _autoTimer = null
    if (_syncing) return
    const target = state.settings.syncAccounts.find(
      (a) => a.autoSync && (a.lastSyncAt ?? 0) + 60000 < Date.now(),
    )
    if (target) void store.syncNow(target.id)
  }, 3000)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): AppData {
  return state
}

export function useStore(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function update(mut: (draft: AppData) => void) {
  const next: AppData = JSON.parse(JSON.stringify(state))
  mut(next)
  state = next
  emit()
}

function pushAudit(
  draft: AppData,
  action: AuditAction,
  taskId: string,
  taskTitle: string,
  detail?: string,
) {
  const ev: AuditEvent = {
    id: uid(),
    at: Date.now(),
    action,
    taskId,
    taskTitle,
    detail,
  }
  draft.audit.unshift(ev)
}

// 用本地 syncAccounts 合并进远端数据，避免账号配置丢失
function applyRemote(remote: AppData) {
  const localAccounts = state.settings.syncAccounts
  const next: AppData = JSON.parse(JSON.stringify(remote))
  if (!next.settings) next.settings = { theme: 'light', onboarded: true, syncAccounts: [] }
  if (!Array.isArray(next.settings.syncAccounts)) next.settings.syncAccounts = []
  next.settings.syncAccounts = localAccounts
  if (!Array.isArray(next.audit)) next.audit = []
  if (typeof next.updatedAt !== 'number') next.updatedAt = Date.now()
  state = next
  emit()
}

export const store = {
  get activeTask(): Task | undefined {
    return state.tasks.find((t) => t.status === 'active')
  },

  createTask(input: { title: string; why?: string; steps: string[] }) {
    if (this.activeTask) return
    const title = input.title.trim()
    if (!title) return
    const steps: Step[] = (input.steps.length
      ? input.steps
      : ['开始做这件事']
    )
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title2) => ({ id: uid(), title: title2, done: false }))

    const task: Task = {
      id: uid(),
      title,
      why: input.why?.trim() || undefined,
      steps,
      status: 'active',
      createdAt: Date.now(),
    }
    update((d) => {
      d.tasks.unshift(task)
      pushAudit(d, 'create', task.id, task.title)
    })
    return task.id
  },

  toggleStep(taskId: string, stepId: string) {
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t) return
      const s = t.steps.find((x) => x.id === stepId)
      if (!s) return
      s.done = !s.done
      s.completedAt = s.done ? Date.now() : undefined
      pushAudit(
        d,
        s.done ? 'step_done' : 'step_undone',
        t.id,
        t.title,
        s.title,
      )
      if (t.steps.length > 0 && t.steps.every((x) => x.done)) {
        t.status = 'completed'
        t.completedAt = Date.now()
        pushAudit(d, 'complete', t.id, t.title)
      } else if (t.status === 'completed') {
        t.status = 'active'
        t.completedAt = undefined
      }
    })
  },

  addStep(taskId: string, title: string) {
    const t2 = title.trim()
    if (!t2) return
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'active') return
      t.steps.push({ id: uid(), title: t2, done: false })
      pushAudit(d, 'step_add', t.id, t.title, t2)
    })
  },

  editStep(taskId: string, stepId: string, title: string) {
    const t2 = title.trim()
    if (!t2) return
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t) return
      const s = t.steps.find((x) => x.id === stepId)
      if (!s) return
      s.title = t2
      pushAudit(d, 'step_edit', t.id, t.title, t2)
    })
  },

  deleteStep(taskId: string, stepId: string) {
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'active') return
      if (t.steps.length <= 1) return
      const s = t.steps.find((x) => x.id === stepId)
      t.steps = t.steps.filter((x) => x.id !== stepId)
      if (s) pushAudit(d, 'step_delete', t.id, t.title, s.title)
    })
  },

  completeTask(taskId: string) {
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'active') return
      for (const s of t.steps) {
        s.done = true
        if (!s.completedAt) s.completedAt = Date.now()
      }
      t.status = 'completed'
      t.completedAt = Date.now()
      pushAudit(d, 'complete', t.id, t.title)
    })
  },

  releaseTask(taskId: string, reason: string) {
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'active') return
      t.status = 'released'
      t.releasedAt = Date.now()
      t.releaseReason = reason.trim() || undefined
      pushAudit(d, 'release', t.id, t.title, t.releaseReason)
    })
  },

  resumeTask(taskId: string) {
    if (this.activeTask) return
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'released') return
      t.status = 'active'
      t.releasedAt = undefined
      t.releaseReason = undefined
      pushAudit(d, 'resume', t.id, t.title)
    })
  },

  reopenCompleted(taskId: string): string | undefined {
    if (this.activeTask) return
    const src = state.tasks.find((t) => t.id === taskId)
    if (!src || src.status !== 'completed') return
    const task: Task = {
      id: uid(),
      title: src.title,
      why: src.why,
      steps: src.steps.map((s) => ({
        id: uid(),
        title: s.title,
        done: false,
      })),
      status: 'active',
      createdAt: Date.now(),
    }
    update((d) => {
      d.tasks.unshift(task)
      pushAudit(d, 'create', task.id, task.title, `再次面对：${src.title}`)
    })
    return task.id
  },

  deleteTask(taskId: string) {
    const before = state.tasks.find((t) => t.id === taskId)
    update((d) => {
      d.tasks = d.tasks.filter((t) => t.id !== taskId)
      if (before) pushAudit(d, 'delete', before.id, before.title)
    })
  },

  clearHistory() {
    update((d) => {
      d.tasks = d.tasks.filter((t) => t.status === 'active')
    })
  },

  clearAudit() {
    update((d) => {
      d.audit = []
    })
  },

  searchAudit(
    keyword: string,
    action: AuditAction | 'all' = 'all',
    from?: number,
    to?: number,
  ): AuditEvent[] {
    const kw = keyword.trim().toLowerCase()
    return state.audit.filter((e) => {
      if (action !== 'all' && e.action !== action) return false
      if (from !== undefined && e.at < from) return false
      if (to !== undefined && e.at > to) return false
      if (kw) {
        const hay = `${e.taskTitle} ${e.detail ?? ''}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  },

  setTheme(theme: ThemeMode) {
    update((d) => {
      d.settings.theme = theme
    })
  },

  toggleTheme() {
    this.setTheme(state.settings.theme === 'dark' ? 'light' : 'dark')
  },

  setOnboarded(v: boolean) {
    update((d) => {
      d.settings.onboarded = v
    })
  },

  exportData(): string {
    return JSON.stringify(state, null, 2)
  },

  importData(json: string): { ok: boolean; error?: string; replaced: number } {
    try {
      const parsed = JSON.parse(json) as Partial<AppData>
      if (!parsed || typeof parsed !== 'object')
        return { ok: false, error: '数据格式不正确', replaced: 0 }
      if (!Array.isArray((parsed as AppData).tasks))
        return { ok: false, error: '缺少任务列表字段', replaced: 0 }
      const tasks = (parsed as AppData).tasks as Task[]
      for (const t of tasks) {
        if (typeof t.id !== 'string' || typeof t.title !== 'string')
          return { ok: false, error: '任务结构不合法', replaced: 0 }
        if (!Array.isArray(t.steps)) t.steps = []
      }
      const replaced = tasks.length
      const remoteAudit = Array.isArray((parsed as AppData).audit)
        ? ((parsed as AppData).audit as AuditEvent[])
        : []
      const next: AppData = {
        version: DATA_VERSION,
        tasks,
        settings: {
          theme:
            (parsed as AppData).settings?.theme === 'dark'
              ? 'dark'
              : 'light',
          onboarded:
            (parsed as AppData).settings?.onboarded ?? state.settings.onboarded,
          syncAccounts: state.settings.syncAccounts,
        },
        updatedAt: Date.now(),
        audit: remoteAudit,
      }
      state = next
      // 记一条导入事件
      update((d) => {
        pushAudit(d, 'import', '', '', `导入 ${replaced} 条记录`)
      })
      return { ok: true, replaced }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : '解析失败',
        replaced: 0,
      }
    }
  },

  // —— WebDAV 同步 ——
  addSyncAccount(input: Omit<SyncAccount, 'id'>): string {
    const acc: SyncAccount = { id: uid(), ...input }
    update((d) => {
      d.settings.syncAccounts.push(acc)
    })
    return acc.id
  },

  updateSyncAccount(id: string, patch: Partial<SyncAccount>) {
    update((d) => {
      const acc = d.settings.syncAccounts.find((a) => a.id === id)
      if (!acc) return
      Object.assign(acc, patch)
    })
  },

  deleteSyncAccount(id: string) {
    update((d) => {
      d.settings.syncAccounts = d.settings.syncAccounts.filter(
        (a) => a.id !== id,
      )
    })
  },

  async testSyncAccount(
    account: SyncAccount,
  ): Promise<{ ok: boolean; error?: string }> {
    return webdavTest(account)
  },

  async syncNow(
    accountId: string,
  ): Promise<{
    ok: boolean
    message: string
    direction?: 'push' | 'pull' | 'none'
  }> {
    const acc = state.settings.syncAccounts.find((a) => a.id === accountId)
    if (!acc) return { ok: false, message: '账号不存在' }
    _syncing = true
    try {
      const pulled = await webdavPull(acc)
      if (!pulled.ok) {
        this.updateSyncAccount(accountId, {
          lastError: pulled.error,
        })
        return { ok: false, message: pulled.error ?? '拉取失败' }
      }

      // 远端无数据 → push 本地
      if (pulled.data === undefined) {
        const pushRes = await webdavPush(acc, JSON.stringify(state))
        if (!pushRes.ok) {
          this.updateSyncAccount(accountId, { lastError: pushRes.error })
          return { ok: false, message: pushRes.error ?? '上传失败' }
        }
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) =>
          pushAudit(d, 'sync_push', '', '', acc.name),
        )
        return { ok: true, message: '已上传本地数据到远端', direction: 'push' }
      }

      // 解析远端
      let remote: AppData | null = null
      try {
        remote = JSON.parse(pulled.data) as AppData
      } catch {
        const pushRes = await webdavPush(acc, JSON.stringify(state))
        if (!pushRes.ok) {
          this.updateSyncAccount(accountId, { lastError: pushRes.error })
          return { ok: false, message: pushRes.error ?? '上传失败' }
        }
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) => pushAudit(d, 'sync_push', '', '', acc.name))
        return {
          ok: true,
          message: '远端数据异常，已用本地覆盖',
          direction: 'push',
        }
      }

      lastRemote = { accountId, json: pulled.data }

      const remoteUpdated = typeof remote.updatedAt === 'number' ? remote.updatedAt : 0
      const localUpdated = state.updatedAt
      const lastSync = acc.lastSyncAt ?? 0
      const remoteChanged = remoteUpdated > lastSync
      const localChanged = localUpdated > lastSync

      if (remoteChanged && localChanged) {
        this.updateSyncAccount(accountId, {
          lastError: '冲突：本地与远端都有新改动',
        })
        return {
          ok: false,
          message: '冲突：本地与远端都有新改动，请选择',
        }
      }

      if (localChanged && !remoteChanged) {
        const pushRes = await webdavPush(acc, JSON.stringify(state))
        if (!pushRes.ok) {
          this.updateSyncAccount(accountId, { lastError: pushRes.error })
          return { ok: false, message: pushRes.error ?? '上传失败' }
        }
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) => pushAudit(d, 'sync_push', '', '', acc.name))
        return { ok: true, message: '已上传本地改动', direction: 'push' }
      }

      if (remoteChanged && !localChanged) {
        applyRemote(remote)
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) => pushAudit(d, 'sync_pull', '', '', acc.name))
        return { ok: true, message: '已拉取远端改动', direction: 'pull' }
      }

      // 两边都没变
      this.updateSyncAccount(accountId, {
        lastSyncAt: Date.now(),
        lastError: undefined,
      })
      return { ok: true, message: '已是最新', direction: 'none' }
    } finally {
      _syncing = false
    }
  },

  async resolveConflict(
    accountId: string,
    choice: 'local' | 'remote',
  ): Promise<{ ok: boolean; message: string }> {
    const acc = state.settings.syncAccounts.find((a) => a.id === accountId)
    if (!acc) return { ok: false, message: '账号不存在' }
    _syncing = true
    try {
      if (choice === 'local') {
        const pushRes = await webdavPush(acc, JSON.stringify(state))
        if (!pushRes.ok) {
          this.updateSyncAccount(accountId, { lastError: pushRes.error })
          return { ok: false, message: pushRes.error ?? '上传失败' }
        }
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) => pushAudit(d, 'sync_push', '', '', acc.name))
        return { ok: true, message: '已用本地覆盖远端' }
      } else {
        if (!lastRemote || lastRemote.accountId !== accountId) {
          return { ok: false, message: '远端数据已失效，请重新同步' }
        }
        let remote: AppData | null = null
        try {
          remote = JSON.parse(lastRemote.json) as AppData
        } catch {
          return { ok: false, message: '远端数据解析失败' }
        }
        applyRemote(remote)
        this.updateSyncAccount(accountId, {
          lastSyncAt: Date.now(),
          lastError: undefined,
        })
        update((d) => pushAudit(d, 'sync_pull', '', '', acc.name))
        return { ok: true, message: '已用远端覆盖本地' }
      }
    } finally {
      _syncing = false
    }
  },
}

export type Store = typeof store
