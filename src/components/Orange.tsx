import { useMemo } from 'react'
import { motion } from 'motion/react'

type Props = {
  total: number
  done: number
  size?: number
  completed?: boolean
  dimmed?: boolean
  animate?: boolean
}

const CX = 100
const CY = 104
const R = 74
const INNER = 64

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function wedgePath(startDeg: number, endDeg: number): string {
  const o = polar(CX, CY, R, startDeg)
  const i = polar(CX, CY, R, endDeg)
  const oi = polar(CX, CY, INNER, startDeg)
  const ii = polar(CX, CY, INNER, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${o.x} ${o.y}`,
    `A ${R} ${R} 0 ${large} 1 ${i.x} ${i.y}`,
    `L ${ii.x} ${ii.y}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${oi.x} ${oi.y}`,
    'Z',
  ].join(' ')
}

const GRAD_ID = 'orange-grad'

export function Orange({
  total,
  done,
  size = 220,
  completed = false,
  dimmed = false,
  animate = true,
}: Props) {
  const segments = useMemo(() => {
    const n = Math.max(1, total)
    const each = 360 / n
    return Array.from({ length: n }, (_, i) => {
      const start = i * each
      const end = start + each
      const isDone = i < done
      return { id: i, d: wedgePath(start, end), isDone }
    })
  }, [total, done])

  const empty = done === 0

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`橘子进度：${done} / ${total}`}
      initial={animate ? { scale: 0.96, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={GRAD_ID} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#FFD9A8" />
          <stop offset="50%" stopColor="#F2A65A" />
          <stop offset="100%" stopColor="#E8893A" />
        </radialGradient>
        <radialGradient id="peel-grad" cx="40%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#F7C992" />
          <stop offset="55%" stopColor="#E8893A" />
          <stop offset="100%" stopColor="#C96A28" />
        </radialGradient>
        <radialGradient id="dim-grad" cx="40%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#F5EDDF" />
          <stop offset="100%" stopColor="#EFE3CF" />
        </radialGradient>
        <radialGradient id="glow-grad" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#F2A65A" stopOpacity="0.5" />
          <stop offset="62%" stopColor="#E8893A" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#E8893A" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* stem & leaf */}
      <g opacity={dimmed ? 0.5 : 1}>
        <path
          d="M100 36 q-9 -20 5 -28 q12 9 4 26 z"
          fill="#7FAE5A"
        />
        <path
          d="M100 38 q7 -14 16 -14 q-5 12 -12 16 z"
          fill="#9BC76A"
          opacity="0.85"
        />
      </g>

      {/* outer peel —— 空状态不填充，交给下方描边环 */}
      {!empty && (
        <circle
          cx={CX}
          cy={CY}
          r={R + 4}
          fill="url(#peel-grad)"
          opacity={dimmed ? 0.35 : 0.9}
        />
      )}

      {/* flesh disc base */}
      <circle
        cx={CX}
        cy={CY}
        r={INNER + 1}
        fill={dimmed ? 'url(#dim-grad)' : empty ? 'url(#glow-grad)' : '#FFF4E0'}
        opacity={dimmed ? 0.85 : 1}
      />

      {/* empty state: 柔和描边环，避免在深色背景下显得浑浊 */}
      {empty && !dimmed && (
        <>
          <circle
            cx={CX}
            cy={CY}
            r={R + 4}
            fill="none"
            stroke="url(#peel-grad)"
            strokeWidth={2.2}
            opacity={0.55}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R + 12}
            fill="none"
            stroke="url(#peel-grad)"
            strokeWidth={0.8}
            opacity={0.18}
          />
        </>
      )}

      {/* segments */}
      <g filter={completed ? 'url(#soft-glow)' : undefined}>
        {segments.map((s) => (
          <motion.path
            key={s.id}
            d={s.d}
            fill={s.isDone ? `url(#${GRAD_ID})` : 'none'}
            stroke={dimmed ? '#D8CBB4' : '#C96A28'}
            strokeWidth={1.1}
            strokeOpacity={s.isDone ? 0.25 : 0.35}
            initial={animate && s.isDone ? { opacity: 0, scale: 0.7 } : false}
            animate={{ opacity: s.isDone ? 1 : empty ? 0.4 : 0.6, scale: 1 }}
            transition={{ duration: 0.5, delay: s.isDone ? s.id * 0.06 : 0 }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />
        ))}
      </g>

      {/* center pip */}
      <circle
        cx={CX}
        cy={CY}
        r={empty ? 3 : 4}
        fill={empty ? '#D8CBB4' : '#FFF4E0'}
        opacity={0.8}
      />

      {/* highlight —— 空状态不画，避免深色背景下出现灰色斑块 */}
      {!empty && (
        <ellipse
          cx={CX - 22}
          cy={CY - 26}
          rx={14}
          ry={9}
          fill="#FFFFFF"
          opacity={0.26}
        />
      )}
    </motion.svg>
  )
}

export function OrangeMini({
  done,
  total,
  size = 56,
  released = false,
}: {
  done: number
  total: number
  size?: number
  released?: boolean
}) {
  const ratio = total > 0 ? done / total : 0
  const empty = done === 0
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id={`mini-${released ? 'r' : 'o'}`} cx="40%" cy="34%" r="80%">
          <stop offset="0%" stopColor={released ? '#E6DBC8' : '#F7C992'} />
          <stop offset="100%" stopColor={released ? '#B8AFA6' : '#E8893A'} />
        </radialGradient>
      </defs>
      <path d="M100 36 q-9 -20 5 -28 q12 9 4 26 z" fill={released ? '#A8B59A' : '#7FAE5A'} opacity="0.8" />
      <circle cx={CX} cy={CY} r={R + 4} fill={`url(#mini-${released ? 'r' : 'o'})`} opacity={empty ? 0.4 : 0.92} />
      <circle cx={CX} cy={CY} r={INNER} fill="#FFE9C9" opacity={empty ? 0.4 : 0.5} />
      <circle cx={CX} cy={CY} r={INNER * (0.35 + 0.65 * ratio)} fill={released ? '#C9BFAE' : '#F2A65A'} opacity={0.9} />
      <ellipse cx={CX - 22} cy={CY - 26} rx={12} ry={8} fill="#FFFFFF" opacity={0.25} />
    </svg>
  )
}
