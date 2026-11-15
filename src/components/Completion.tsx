import { motion, AnimatePresence } from 'motion/react'
import { Orange } from './Orange'
import type { Task } from '../types'

type Props = {
  task: Task | null
  onClose: () => void
}

export function Completion({ task, onClose }: Props) {
  const done = task?.steps.length ?? 0
  const total = task?.steps.length ?? 0

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-cream-100/95 dark:bg-night-900/95 backdrop-blur-md" />
          <motion.div
            className="relative flex flex-col items-center text-center max-w-reading"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Orange total={total} done={done} completed size={240} />
            </motion.div>

            <motion.p
              className="mt-6 text-xs tracking-widest text-orange-deep uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              收下一颗橘子
            </motion.p>
            <motion.h2
              className="mt-3 text-xl font-medium text-ink-900 dark:text-cream-100"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {task.title}
            </motion.h2>
            <motion.p
              className="mt-4 text-sm text-ink-500 dark:text-ink-300 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              今天的你，给未来的自己送去了一批援军。
              <br />
              下一件事，等你准备好了再放进来。
            </motion.p>

            <motion.button
              onClick={onClose}
              className="mt-8 rounded-xl bg-orange-peel text-white px-8 py-3 text-sm font-medium hover:bg-orange-deep transition-colors shadow-soft"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              好的
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
