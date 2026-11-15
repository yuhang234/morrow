import { useMemo, useState } from 'react'
import { Inbox, Search, RotateCcw, RefreshCw, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { store } from '../store'
import { useStore } from '../store'
import { formatDate } from '../lib/format'
import type { AuditAction, AuditEvent } from '../types'

const ACTION_LABELS: Record<AuditAction, string> = {
  create: '创建',
  step_done: '完成步骤',
  step_undone: '撤销步骤',
  step_add: '新增步骤',
  step_edit: '编辑步骤',
  step_delete: '删除步骤',
  complete: '收获',
  release: '放下',
  resume: '重新拾起',
  delete: '删除',
  sync_push: '同步上传',
  sync_pull: '同步拉取',
  import: '导入',
}

type Filter = AuditAction | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'create', label: '创建' },
  { key: 'complete', label: '完成' },
  { key: 'release', label: '放下' },
  { key: 'resume', label: '恢复' },
  { key: 'sync_push', label: '同步' },
]

function timeLabel(at: number): string {
  const d = new Date(at)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(at)} ${hh}:${mm}`
}

export function History() {
  const data = useStore()
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const hasActive = !!data.tasks.find((t) => t.status === 'active')

  const fromTs = from ? new Date(from + 'T00:00:00').getTime() : undefined
  const toTs = to ? new Date(to + 'T23:59:59').getTime() : undefined

  const list = useMemo(
    () => store.searchAudit(keyword, filter, fromTs, toTs),
    // 依赖 data.audit 与筛选条件；data 引用变化即重算
    [keyword, filter, from, to, data],
  )

  const detail = list.find((e) => e.id === detailId) ?? null

  // 关联任务，用于显示“重新拾起/再次面对”按钮
  const linkedTask = (e: AuditEvent) =>
    data.tasks.find((t) => t.id === e.taskId)

  return (
    <div className="px-5 sm:px-6 pt-6 pb-32 max-w-reading mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-ink-900 dark:text-cream-100">
          历史
        </h1>
        <button
          onClick={() => setConfirmClear(true)}
          disabled={data.audit.length === 0}
          className="inline-flex items-center gap-1 text-xs text-ink-500 dark:text-ink-300 hover:text-orange-deep disabled:opacity-40 transition-colors"
        >
          <Trash2 size={13} />
          清空
        </button>
      </div>

      {/* 搜索 */}
      <div className="mt-4 relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 dark:text-ink-500"
        />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索任务或详情"
          className="w-full text-sm rounded-xl border border-cream-300 dark:border-night-600 bg-white dark:bg-night-800 pl-9 pr-3 py-2.5 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none"
        />
      </div>

      {/* 筛选 segment */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? 'bg-orange-peel text-white'
                : 'bg-cream-200 dark:bg-night-800 text-ink-500 dark:text-ink-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 日期范围 */}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-800 px-2 py-1.5 text-ink-700 dark:text-cream-200 focus:border-orange-peel focus:outline-none"
        />
        <span>—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-800 px-2 py-1.5 text-ink-700 dark:text-cream-200 focus:border-orange-peel focus:outline-none"
        />
      </div>

      {/* 列表 */}
      {list.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-ink-300 dark:text-ink-500">
          <Inbox size={32} strokeWidth={1.4} />
          <p className="mt-3 text-sm">还没有任何记录。</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {list.map((e) => {
            const t = linkedTask(e)
            const showResume =
              e.action === 'release' && t?.status === 'released'
            const showReopen =
              e.action === 'complete' && t?.status === 'completed'
            return (
              <li
                key={e.id}
                className="rounded-xl bg-white dark:bg-night-800 border border-cream-200/70 dark:border-night-700 px-4 py-3"
              >
                <button
                  onClick={() => setDetailId(e.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink-300 dark:text-ink-500">
                      {timeLabel(e.at)}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream-200 dark:bg-night-700 text-ink-700 dark:text-cream-200">
                      {ACTION_LABELS[e.action]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-900 dark:text-cream-100 line-clamp-1">
                    {e.taskTitle || '（已删除的任务）'}
                  </p>
                  {e.detail && (
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300 line-clamp-1">
                      {e.detail}
                    </p>
                  )}
                </button>
                {(showResume || showReopen) && (
                  <div className="mt-2 flex justify-end">
                    {showResume && (
                      <button
                        onClick={() => {
                          if (!hasActive) {
                            store.resumeTask(e.taskId)
                            setDetailId(null)
                          }
                        }}
                        disabled={hasActive}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-peel text-white px-3 py-1.5 text-[11px] font-medium hover:bg-orange-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={12} />
                        {hasActive ? '先完成当前的事' : '重新拾起'}
                      </button>
                    )}
                    {showReopen && (
                      <button
                        onClick={() => {
                          if (!hasActive) {
                            store.reopenCompleted(e.taskId)
                            setDetailId(null)
                          }
                        }}
                        disabled={hasActive}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-peel text-white px-3 py-1.5 text-[11px] font-medium hover:bg-orange-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={12} />
                        {hasActive ? '先完成当前的事' : '再次面对'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* 详情 */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title="记录详情"
      >
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 rounded-full bg-cream-200 dark:bg-night-700 text-ink-700 dark:text-cream-200">
                {ACTION_LABELS[detail.action]}
              </span>
              <span className="text-[11px] text-ink-300 dark:text-ink-500">
                {timeLabel(detail.at)}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-ink-300 dark:text-ink-500 mb-1">
                任务
              </p>
              <p className="text-sm text-ink-900 dark:text-cream-100">
                {detail.taskTitle || '（已删除的任务）'}
              </p>
            </div>
            {detail.detail && (
              <div>
                <p className="text-[11px] text-ink-300 dark:text-ink-500 mb-1">
                  详情
                </p>
                <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
                  {detail.detail}
                </p>
              </div>
            )}
            <p className="text-[11px] text-ink-300 dark:text-ink-500 pt-1">
              任务 ID：{detail.taskId || '—'}
            </p>
          </div>
        )}
      </Modal>

      {/* 清空确认 */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="清空历史日志？"
      >
        <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
          将清除全部操作记录（{data.audit.length} 条）。任务本身不会被删除。此操作无法撤销。
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
              store.clearAudit()
              setConfirmClear(false)
            }}
            className="flex-1 rounded-xl bg-orange-deep text-white py-2.5 text-sm font-medium hover:bg-orange-peel transition-colors"
          >
            清空
          </button>
        </div>
      </Modal>
    </div>
  )
}
