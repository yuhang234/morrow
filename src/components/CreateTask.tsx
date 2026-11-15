import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { Modal } from './Modal'
import { store } from '../store'

type Props = {
  open: boolean
  onClose: () => void
}

export function CreateTask({ open, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [error, setError] = useState('')

  function reset() {
    setTitle('')
    setWhy('')
    setSteps([''])
    setError('')
  }

  function close() {
    reset()
    onClose()
  }

  function submit() {
    const t = title.trim()
    if (!t) {
      setError('给这件事起个名字吧。')
      return
    }
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)
    store.createTask({ title: t, why, steps: cleanSteps })
    close()
  }

  function updateStep(i: number, v: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? v : s)))
  }

  function addStepField() {
    setSteps((prev) => [...prev, ''])
  }

  function removeStepField(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <Modal open={open} onClose={close} title="放入一件事">
      <div className="space-y-5">
        <p className="text-sm text-ink-500 dark:text-ink-300 leading-relaxed">
          放进那件你正在躲的事。不用完成整件事，先迈出很小的一步。
        </p>

        <div>
          <label className="block text-xs font-medium text-ink-700 dark:text-cream-200 mb-1.5">
            这件事是
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError('')
            }}
            placeholder="比如：写完毕业论文绪论"
            className="w-full rounded-xl border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-4 py-3 text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none transition-colors"
          />
          {error && (
            <p className="mt-1.5 text-xs text-orange-deep">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-700 dark:text-cream-200 mb-1.5">
            为什么想完成它 <span className="text-ink-300">（选填）</span>
          </label>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            placeholder="想想完成后的自己，会因此少面对什么麻烦"
            className="w-full resize-none rounded-xl border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-4 py-3 text-sm text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-ink-700 dark:text-cream-200">
              拆成小步 <span className="text-ink-300">（至少一步）</span>
            </label>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs text-ink-300 w-4 shrink-0 text-right">
                    {i + 1}
                  </span>
                  <input
                    value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && i === steps.length - 1) {
                        e.preventDefault()
                        addStepField()
                      }
                    }}
                    placeholder={
                      i === 0 ? '先接触它 5 分钟' : '下一步……'
                    }
                    className="flex-1 rounded-lg border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-3 py-2.5 text-sm text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none transition-colors"
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStepField(i)}
                      aria-label="删除这一步"
                      className="p-2 rounded-lg text-ink-300 hover:text-orange-deep hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <button
            onClick={addStepField}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-cobalt hover:text-cobalt-soft transition-colors"
          >
            <Plus size={15} /> 再加一步
          </button>
        </div>

        <div className="rounded-xl bg-orange-soft/30 dark:bg-orange-deep/15 px-4 py-3 text-xs text-ink-700 dark:text-cream-200 flex items-start gap-2 leading-relaxed">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-orange-peel" />
          <span>
            只此一件——在它了结或体面放下之前，你无法放入第二件。这是留给自己的余地。
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={close}
            className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-3 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
          >
            先不开始
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-xl bg-orange-peel text-white py-3 text-sm font-medium hover:bg-orange-deep transition-colors shadow-soft"
          >
            放进来
          </button>
        </div>
      </div>
    </Modal>
  )
}
