// src/components/assessment/QuestionDate.tsx
// Tarih input — paper theme, dimension-aware
// Conversation Mode

'use client'

import type {
  DateQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: DateQuestion
  dimension: Dimension
  value: string | null
  onChange: (newValue: string | null) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionDate({ dimension, value, onChange }: Props) {
  const dimColor = dimensionColorVar[dimension]
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <input
        type="date"
        value={value ?? ''}
        max={today}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : raw)
        }}
        className="px-4 py-3 rounded-2xl border-2 bg-humanos-surface text-humanos-text font-sans text-base transition-all duration-220 ease-out focus:outline-none"
        style={{
          borderColor: 'var(--color-humanos-border)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = dimColor
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-humanos-border)'
        }}
      />
    </div>
  )
}
