import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  Check,
  Pencil,
  Trash2,
  ArrowDownToLine,
  Flag,
} from 'lucide-react'
import { Orange } from './Orange'
import { store } from '../store'
import type { Task } from '../types'

type Props = {
  task: Task | undefined
  onAdd: () => void
  onRelease: (taskId: string) => void
}

export function Home({ task, onAdd, onRelease }: Props) {
  if (!task) return <EmptyState onAdd={onAdd} />
  return <ActiveTask task={task} onRelease={onRelease} />
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="animate-breathe">
          <Orange total={6} done={0} size={200} animate={false} />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-lg text-ink-700 dark:text-cream-200 leading-relaxed"
      >
        今天，你想增援未来的自己什么？
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        onClick={onAdd}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-peel text-white px-7 py-3.5 text-sm font-medium hover:bg-orange-deep transition-colors shadow-soft"
      >
        <Plus size={17} />
        放入一件事
      </motion.button>
    </div>
  )
}

function ActiveTask({
  task,
  onRelease,
}: {
  task: Task
  onRelease: (taskId: string) => void
}) {
  const total = task.steps.length
  const done = task.steps.filter((s) => s.done).length
  const nextStep = task.steps.find((s) => !s.done)
  const allDone = done === total

  return (
    <div className="px-5 sm:px-6 pt-6 pb-32">
      <AnimatePresence mode="wait">
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col items-center text-center">
            <Orange total={total} done={done} size={170} />
            <p className="mt-2 text-xs text-ink-300 dark:text-ink-500">
              {done} / {total} 瓣
            </p>
            <h1 className="mt-3 text-xl sm:text-2xl font-medium text-ink-900 dark:text-cream-100 leading-snug max-w-reading">
              {task.title}
            </h1>
            {task.why && (
              <p className="mt-3 text-sm text-ink-500 dark:text-ink-300 leading-relaxed max-w-reading">
                {task.why}
              </p>
            )}
          </div>

          {nextStep && !allDone && (
            <div className="mt-8 rounded-2xl bg-white dark:bg-night-800 border border-cream-300/70 dark:border-night-700 px-5 py-4 shadow-soft">
              <p className="text-xs text-ink-300 dark:text-ink-500 mb-1">
                下一步
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-900 dark:text-cream-100 font-medium">
                  {nextStep.title}
                </p>
                <button
                  onClick={() => store.toggleStep(task.id, nextStep.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-orange-peel text-white px-3.5 py-2 text-xs font-medium hover:bg-orange-deep transition-colors"
                >
                  <Check size={14} />
                  完成这一步
                </button>
              </div>
            </div>
          )}

          <StepList task={task} />

          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={() => store.completeTask(task.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-peel text-white px-7 py-3 text-sm font-medium hover:bg-orange-deep transition-colors shadow-soft"
              >
                <Flag size={16} />
                收下这颗橘子
              </button>
            </motion.div>
          )}

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => onRelease(task.id)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-300 hover:text-cobalt dark:text-ink-500 transition-colors"
            >
              <ArrowDownToLine size={13} />
              暂时放下
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StepList({ task }: { task: Task }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [newStep, setNewStep] = useState('')

  function startEdit(id: string, title: string) {
    setEditingId(id)
    setDraft(title)
  }

  function saveEdit(id: string) {
    store.editStep(task.id, id, draft)
    setEditingId(null)
  }

  function commitAdd() {
    if (newStep.trim()) {
      store.addStep(task.id, newStep)
      setNewStep('')
      setAdding(false)
    }
  }

  return (
    <div className="mt-6">
      <p className="text-xs text-ink-300 dark:text-ink-500 mb-2 px-1">
        全部步骤
      </p>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {task.steps.map((s) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 rounded-xl bg-cream-50 dark:bg-night-800/60 px-3.5 py-3 border border-cream-200/60 dark:border-night-700/60"
            >
              <button
                onClick={() => store.toggleStep(task.id, s.id)}
                aria-label={s.done ? '标记为未完成' : '标记为完成'}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  s.done
                    ? 'bg-orange-peel border-orange-peel text-white'
                    : 'border-ink-300 dark:border-night-600 text-transparent hover:border-orange-peel'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </button>

              {editingId === s.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(s.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 text-sm bg-transparent border-b border-orange-peel focus:outline-none text-ink-900 dark:text-cream-100"
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(s.id, s.title)}
                  className={`flex-1 text-sm leading-snug ${
                    s.done
                      ? 'text-ink-300 dark:text-ink-500 line-through'
                      : 'text-ink-900 dark:text-cream-100'
                  }`}
                >
                  {s.title}
                </span>
              )}

              {!s.done && editingId !== s.id && (
                <button
                  onClick={() => startEdit(s.id, s.title)}
                  aria-label="编辑"
                  className="p-1.5 rounded-md text-ink-300 hover:text-ink-700 dark:hover:text-cream-200 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              )}
              {task.steps.length > 1 && (
                <button
                  onClick={() => store.deleteStep(task.id, s.id)}
                  aria-label="删除"
                  className="p-1.5 rounded-md text-ink-300 hover:text-orange-deep transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {adding ? (
        <div className="mt-2 flex items-center gap-2 px-3.5">
          <input
            autoFocus
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd()
              if (e.key === 'Escape') {
                setAdding(false)
                setNewStep('')
              }
            }}
            placeholder="新的一小步"
            className="flex-1 text-sm rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none"
          />
          <button
            onClick={commitAdd}
            className="text-xs text-cobalt font-medium px-2"
          >
            加上
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-cobalt hover:text-cobalt-soft transition-colors px-1"
        >
          <Plus size={13} /> 加一步
        </button>
      )}
    </div>
  )
}
