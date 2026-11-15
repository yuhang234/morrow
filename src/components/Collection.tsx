import { useState } from 'react'
import { motion } from 'motion/react'
import { RotateCcw, Trash2, Inbox } from 'lucide-react'
import { OrangeMini } from './Orange'
import { Modal } from './Modal'
import { store } from '../store'
import type { Task } from '../types'
import { formatDate } from '../lib/format'

type Props = {
  tasks: Task[]
  hasActive: boolean
  onResumed?: () => void
}

type Tab = 'completed' | 'released'

export function Collection({ tasks, hasActive, onResumed }: Props) {
  const [tab, setTab] = useState<Tab>('completed')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const list = tasks
    .filter((t) => t.status === tab)
    .sort((a, b) => {
      const ta = a.completedAt ?? a.releasedAt ?? 0
      const tb = b.completedAt ?? b.releasedAt ?? 0
      return tb - ta
    })

  const detail = tasks.find((t) => t.id === detailId) ?? null

  return (
    <div className="px-5 sm:px-6 pt-6 pb-32 max-w-reading mx-auto">
      <h1 className="text-lg font-medium text-ink-900 dark:text-cream-100">
        橘子墙
      </h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
        每一颗，都是你曾认真面对过的一件事。
      </p>

      <div className="mt-5 inline-flex rounded-full bg-cream-200 dark:bg-night-800 p-1 text-xs">
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-1.5 rounded-full transition-colors ${
            tab === 'completed'
              ? 'bg-white dark:bg-night-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 dark:text-ink-300'
          }`}
        >
          已收获
        </button>
        <button
          onClick={() => setTab('released')}
          className={`px-4 py-1.5 rounded-full transition-colors ${
            tab === 'released'
              ? 'bg-white dark:bg-night-700 text-ink-900 dark:text-cream-100 shadow-sm'
              : 'text-ink-500 dark:text-ink-300'
          }`}
        >
          已放下
        </button>
      </div>

      {list.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-ink-300 dark:text-ink-500">
          <Inbox size={32} strokeWidth={1.4} />
          <p className="mt-3 text-sm">
            {tab === 'completed' ? '还没有收获的橘子。' : '没有放下的事。'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map((t) => {
            const done = t.steps.filter((s) => s.done).length
            return (
              <motion.button
                key={t.id}
                layout
                onClick={() => setDetailId(t.id)}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center rounded-2xl bg-white dark:bg-night-800 border border-cream-200/70 dark:border-night-700 px-3 py-4 shadow-soft hover:shadow-glow transition-shadow"
              >
                <OrangeMini
                  done={done}
                  total={t.steps.length}
                  size={52}
                  released={t.status === 'released'}
                />
                <p className="mt-2 text-xs text-ink-700 dark:text-cream-200 line-clamp-2 leading-snug text-center min-h-[2.4em]">
                  {t.title}
                </p>
                <p className="mt-1 text-[10px] text-ink-300 dark:text-ink-500">
                  {formatDate(
                    t.status === 'completed' ? t.completedAt : t.releasedAt,
                  )}
                </p>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title={detail?.status === 'completed' ? '这颗橘子' : '放下的事'}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <OrangeMini
                done={detail.steps.filter((s) => s.done).length}
                total={detail.steps.length}
                size={72}
                released={detail.status === 'released'}
              />
              <h3 className="mt-3 text-base font-medium text-ink-900 dark:text-cream-100 text-center">
                {detail.title}
              </h3>
              {detail.why && (
                <p className="mt-2 text-xs text-ink-500 dark:text-ink-300 text-center leading-relaxed">
                  {detail.why}
                </p>
              )}
            </div>

            {detail.status === 'released' && detail.releaseReason && (
              <div className="rounded-xl bg-cream-200/60 dark:bg-night-700/60 px-4 py-3">
                <p className="text-[11px] text-ink-300 dark:text-ink-500 mb-1">
                  放下时写下的
                </p>
                <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
                  {detail.releaseReason}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-ink-300 dark:text-ink-500 mb-2">
                步骤
              </p>
              <ul className="space-y-1.5">
                {detail.steps.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.done ? 'bg-orange-peel' : 'bg-ink-300'
                      }`}
                    />
                    <span
                      className={
                        s.done
                          ? 'text-ink-700 dark:text-cream-200'
                          : 'text-ink-300 dark:text-ink-500'
                      }
                    >
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-ink-300 dark:text-ink-500">
              {detail.status === 'completed'
                ? `完成于 ${formatDate(detail.completedAt)}`
                : `放下于 ${formatDate(detail.releasedAt)}`}
            </p>

            <div className="flex gap-3 pt-1">
              {detail.status === 'released' && (
                <button
                  onClick={() => {
                    if (!hasActive) {
                      store.resumeTask(detail.id)
                      setDetailId(null)
                      onResumed?.()
                    }
                  }}
                  disabled={hasActive}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-peel text-white py-2.5 text-xs font-medium hover:bg-orange-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={13} />
                  {hasActive ? '先完成当前的事' : '重新拾起'}
                </button>
              )}
              <button
                onClick={() => setConfirmId(detail.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cream-300 dark:border-night-600 text-ink-500 dark:text-ink-300 px-4 py-2.5 text-xs hover:text-orange-deep hover:border-orange-deep transition-colors"
              >
                <Trash2 size={13} />
                删除
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* delete confirm */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="删除这条记录？"
      >
        <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
          删除后无法恢复。这颗橘子会从墙上消失。
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setConfirmId(null)}
            className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-2.5 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
          >
            留着
          </button>
          <button
            onClick={() => {
              if (confirmId) store.deleteTask(confirmId)
              setConfirmId(null)
              setDetailId(null)
            }}
            className="flex-1 rounded-xl bg-orange-deep text-white py-2.5 text-sm font-medium hover:bg-orange-peel transition-colors"
          >
            删除
          </button>
        </div>
      </Modal>
    </div>
  )
}
