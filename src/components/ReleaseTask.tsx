import { useState } from 'react'
import { Modal } from './Modal'
import { store } from '../store'

type Props = {
  open: boolean
  onClose: () => void
  taskId: string | null
}

export function ReleaseTask({ open, onClose, taskId }: Props) {
  const [reason, setReason] = useState('')

  function close() {
    setReason('')
    onClose()
  }

  function confirm() {
    if (taskId) store.releaseTask(taskId, reason)
    close()
  }

  return (
    <Modal open={open} onClose={close} title="暂时放下">
      <div className="space-y-5">
        <p className="text-sm text-ink-700 dark:text-cream-200 leading-relaxed">
          暂时放下也没关系，你已经认真面对过它。
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-300 leading-relaxed">
          它不会被删除，也不会算作失败。等你想清楚，随时可以重新拾起。
        </p>

        <div>
          <label className="block text-xs font-medium text-ink-700 dark:text-cream-200 mb-1.5">
            放下的原因 <span className="text-ink-300">（选填）</span>
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="写一句给未来自己的话，也许就够了"
            className="w-full resize-none rounded-xl border border-cream-300 dark:border-night-600 bg-white dark:bg-night-700 px-4 py-3 text-sm text-ink-900 dark:text-cream-100 placeholder:text-ink-300 focus:border-orange-peel focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={close}
            className="flex-1 rounded-xl border border-cream-300 dark:border-night-600 text-ink-700 dark:text-cream-200 py-3 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition-colors"
          >
            继续做
          </button>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-cobalt text-white py-3 text-sm font-medium hover:bg-cobalt-soft transition-colors"
          >
            体面地放下
          </button>
        </div>
      </div>
    </Modal>
  )
}
