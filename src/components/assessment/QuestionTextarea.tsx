// src/components/assessment/QuestionTextarea.tsx
// Çok satırlı metin alanı — paper theme, dimension-aware
// Conversation Mode

'use client'

import type {
  TextareaQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: TextareaQuestion
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

export function QuestionTextarea({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]
  const currentLength = value?.length ?? 0
  const maxLength = question.maxLength ?? 500

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : raw)
        }}
        placeholder={question.placeholder ?? ''}
        maxLength={maxLength}
        rows={4}
        className="w-full px-5 py-4 rounded-2xl border-2 bg-humanos-surface text-humanos-text font-sans text-base leading-relaxed transition-all duration-220 ease-out focus:outline-none placeholder:text-humanos-text-subtle placeholder:italic resize-none"
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

      <div className="flex justify-end font-mono text-xs text-humanos-text-subtle">
        {currentLength} / {maxLength}
      </div>
    </div>
  )
}
