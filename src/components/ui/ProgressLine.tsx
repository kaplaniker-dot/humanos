// src/components/ui/ProgressLine.tsx
// Sticky 2px line under the nav — minimal progress indicator
// Conversation Mode

type Props = {
  current: number
  total: number
}

export function ProgressLine({ current, total }: Props) {
  const safeTotal = total > 0 ? total : 1
  const safeCurrent = Math.max(0, Math.min(current, safeTotal))
  const percentage = (safeCurrent / safeTotal) * 100

  return (
    <div
      className="fixed left-0 right-0 h-0.5 bg-humanos-border-faint z-[9]"
      style={{ top: '64px' }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-humanos-accent transition-[width] duration-[800ms] ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
