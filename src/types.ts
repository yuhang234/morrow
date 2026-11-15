export type Step = {
  id: string
  title: string
  done: boolean
  completedAt?: number
}

export type TaskStatus = 'active' | 'completed' | 'released'

export type Task = {
  id: string
  title: string
  why?: string
  steps: Step[]
  status: TaskStatus
  createdAt: number
  completedAt?: number
  releasedAt?: number
  releaseReason?: string
}

 export type ThemeMode = 'light' | 'dark'

 export type AuditAction =
   | 'create'
   | 'step_done'
   | 'step_undone'
   | 'step_add'
   | 'step_edit'
   | 'step_delete'
   | 'complete'
   | 'release'
   | 'resume'
   | 'delete'
   | 'sync_push'
   | 'sync_pull'
   | 'import'

 export type AuditEvent = {
   id: string
   at: number // Date.now()
   action: AuditAction
   taskId: string
   taskTitle: string
   detail?: string // 如步骤标题、放下原因、同步账号名
 }

 export type SyncAccount = {
   id: string
   name: string
   url: string // 如 https://dav.jianguoyun.com/dav/
   username: string
   password: string // 坚果云用应用密码
  path: string // 远端目录，默认 /morrow
   autoSync: boolean
   lastSyncAt?: number
   lastError?: string
 }

 export type AppData = {
   version: number
   tasks: Task[]
   settings: {
     theme: ThemeMode
     onboarded: boolean
     syncAccounts: SyncAccount[]
   }
   updatedAt: number
   audit: AuditEvent[]
 }

 export const DATA_VERSION = 1
