// src/components/assessment/QuestionNumber.tsx
// Sayı input — paper theme, dimension-aware
// Conversation Mode

'use client'

import type {
  NumberQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: NumberQuestion
  dimension: Dimension
  value: number | null
  onChange: (newValue: number | null) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionNumber({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') {
              onChange(null)
              return
            }
            const parsed = parseFloat(raw)
            if (!isNaN(parsed)) {
              onChange(parsed)
            }
          }}
          placeholder="—"
          className="w-32 px-4 py-3 rounded-2xl border-2 bg-humanos-surface text-center font-serif text-3xl font-normal text-humanos-text transition-all duration-220 ease-out focus:outline-none placeholder:text-humanos-text-subtle"
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
        {question.unit && (
          <span className="font-serif italic text-lg text-humanos-text-muted">
            {question.unit}
          </span>
        )}
      </div>

      {(question.min !== undefined || question.max !== undefined) && (
        <p className="text-xs text-humanos-text-subtle font-mono">
          {question.min !== undefined && question.max !== undefined
            ? `${question.min} – ${question.max} arası`
            : question.min !== undefined
              ? `min ${question.min}`
              : `max ${question.max}`}
        </p>
      )}
    </div>
  )
}
