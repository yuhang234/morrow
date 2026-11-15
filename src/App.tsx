import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Home as HomeIcon, Grid2x2, Settings as SettingsIcon, History as HistoryIcon } from 'lucide-react'
import { useStore, store } from './store'
import type { Task } from './types'
import { Home } from './components/Home'
import { Collection } from './components/Collection'
import { Settings } from './components/Settings'
import { Onboarding } from './components/Onboarding'
import { History } from './components/History'
import { CreateTask } from './components/CreateTask'
import { ReleaseTask } from './components/ReleaseTask'
import { Completion } from './components/Completion'

type View = 'home' | 'collection' | 'history' | 'settings'

export default function App() {
  const data = useStore()
  const [view, setView] = useState<View>('home')
  const [createOpen, setCreateOpen] = useState(false)
  const [releaseId, setReleaseId] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<Task | null>(null)

  const activeTask = data.tasks.find((t) => t.status === 'active')
  const history = data.tasks.filter(
    (t) => t.status === 'completed' || t.status === 'released',
  )

  // theme class
  useEffect(() => {
    const root = document.documentElement
    if (data.settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta)
      meta.setAttribute(
        'content',
        data.settings.theme === 'dark' ? '#1B1815' : '#FBF6EE',
      )
  }, [data.settings.theme])

  // detect transition to completed -> celebrate
  const prevStatus = useRef<Record<string, string> | null>(null)
  useEffect(() => {
    const next: Record<string, string> = {}
    let justCompleted: Task | null = null
    for (const t of data.tasks) {
      next[t.id] = t.status
      if (
        prevStatus.current &&
        prevStatus.current[t.id] !== 'completed' &&
        t.status === 'completed'
      ) {
        justCompleted = t
      }
    }
    prevStatus.current = next
    if (justCompleted) setCelebration(justCompleted)
  }, [data.tasks])

  if (!data.settings.onboarded) {
    return (
      <Onboarding
        onDone={() => {
          store.setOnboarded(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-safe">
        <div className="max-w-reading mx-auto px-5 sm:px-6 pt-5 pb-2 flex items-center justify-between">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2"
            aria-label="Morrow"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-peel" />
            <span className="text-sm font-medium tracking-wide text-ink-900 dark:text-cream-100">
              Morrow
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-reading mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {view === 'home' && (
              <Home
                task={activeTask}
                onAdd={() => setCreateOpen(true)}
                onRelease={(id) => setReleaseId(id)}
              />
            )}
            {view === 'collection' && (
              <Collection tasks={history} hasActive={!!activeTask} onResumed={() => setView('home')} />
            )}
            {view === 'history' && <History />}
            {view === 'settings' && (
              <Settings
                theme={data.settings.theme}
                historyCount={history.length}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* bottom nav —— 固定底栏，上方渐隐，滚动内容不会硬生生透出 */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="pointer-events-none h-12 bg-gradient-to-t from-cream-100 via-cream-100/85 to-transparent dark:from-night-900 dark:via-night-900/85" />
        <div className="bg-cream-100/90 dark:bg-night-900/90 backdrop-blur-sm pt-1 pb-4 pb-safe">
          <div className="max-w-reading mx-auto px-6">
            <div className="flex items-center justify-around rounded-full bg-white dark:bg-night-800 border border-cream-200/80 dark:border-night-700 shadow-soft px-1.5 py-1.5">
              <NavButton
                active={view === 'home'}
                onClick={() => setView('home')}
                icon={<HomeIcon size={18} />}
                label="今天"
              />
              <NavButton
                active={view === 'collection'}
                onClick={() => setView('collection')}
                icon={<Grid2x2 size={18} />}
                label="橘子墙"
              />
              <NavButton
                active={view === 'history'}
                onClick={() => setView('history')}
                icon={<HistoryIcon size={18} />}
                label="历史"
              />
              <NavButton
                active={view === 'settings'}
                onClick={() => setView('settings')}
                icon={<SettingsIcon size={18} />}
                label="设置"
              />
            </div>
          </div>
        </div>
      </div>

      <CreateTask open={createOpen} onClose={() => setCreateOpen(false)} />
      <ReleaseTask
        open={!!releaseId}
        onClose={() => setReleaseId(null)}
        taskId={releaseId}
      />
      <Completion task={celebration} onClose={() => setCelebration(null)} />
    </div>
  )
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 sm:px-4 py-1.5 rounded-full transition-colors ${
        active
          ? 'text-orange-peel'
          : 'text-ink-300 dark:text-ink-500 hover:text-ink-700 dark:hover:text-cream-200'
      }`}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  )
}
