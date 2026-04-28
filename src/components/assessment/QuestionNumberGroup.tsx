// src/components/assessment/QuestionNumberGroup.tsx
// Birden fazla sayı tek ekranda — yaş/boy/kilo gibi birleşik sorular için
// Conversation Mode — paper theme, dimension-aware

'use client'

import type {
  NumberGroupQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: NumberGroupQuestion
  dimension: Dimension
  value: Record<string, number | null> | null
  onChange: (newValue: Record<string, number | null>) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionNumberGroup({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]
  const currentValues = value ?? {}

  function updateField(fieldId: string, raw: string) {
    const next: Record<string, number | null> = { ...currentValues }
    if (raw === '') {
      next[fieldId] = null
    } else {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        next[fieldId] = parsed
      }
    }
    onChange(next)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {question.fields.map((field) => {
        const fieldValue = currentValues[field.id]

        return (
          <div key={field.id} className="flex flex-col gap-2">
            <label className="text-xs font-medium text-humanos-text-muted uppercase tracking-wider">
              {field.label}
            </label>

            <div className="flex items-baseline gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={field.min}
                max={field.max}
                value={fieldValue ?? ''}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder="—"
                className="w-full px-4 py-3 rounded-xl border-2 bg-humanos-surface text-center font-serif text-2xl font-normal text-humanos-text transition-all duration-220 ease-out focus:outline-none placeholder:text-humanos-text-subtle"
                style={{
                  borderColor: 'var(--color-humanos-border)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = dimColor
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    'var(--color-humanos-border)'
                }}
              />
            </div>

            {field.unit && (
              <span className="text-xs font-mono text-humanos-text-subtle text-center">
                {field.unit}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
