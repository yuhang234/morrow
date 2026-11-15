import { motion } from 'motion/react'
import { Orange } from './Orange'

type Props = {
  onDone: () => void
}

export function Onboarding({ onDone }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-8 text-center bg-cream-100 dark:bg-night-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="animate-floaty"
      >
        <Orange total={8} done={3} size={180} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-10 text-[11px] tracking-[0.3em] text-ink-300 dark:text-ink-500 uppercase"
      >
        一颗橘子，一个明天
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-2xl font-medium text-ink-900 dark:text-cream-100"
      >
        Morrow
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-3 text-sm text-ink-500 dark:text-ink-300 leading-relaxed max-w-xs"
      >
        一次只放一件事。做完了，才能放下一件。
        <br />
        每解决一件拖延的事，都是在增援未来的自己。
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={onDone}
        className="mt-12 rounded-full bg-orange-peel text-white px-8 py-3.5 text-sm font-medium hover:bg-orange-deep transition-colors shadow-soft"
      >
        开始
      </motion.button>
    </motion.div>
  )
}
