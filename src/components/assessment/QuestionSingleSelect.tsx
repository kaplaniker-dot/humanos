// src/components/assessment/QuestionSingleSelect.tsx
// Tek seçimli soru — paper theme, dimension-aware
// Conversation Mode

'use client'

import type {
  SingleSelectQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: SingleSelectQuestion
  dimension: Dimension
  value: string | null
  onChange: (newValue: string) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionSingleSelect({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-humanos-surface text-[15px] text-humanos-text font-sans cursor-pointer transition-all duration-220 ease-out hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(26,24,20,0.04)]"
            style={{
              borderColor: isSelected ? dimColor : 'var(--color-humanos-border)',
              background: isSelected
                ? `linear-gradient(to right, ${dimColor}10, ${dimColor}04)`
                : 'var(--color-humanos-surface)',
            }}
          >
            <div
              className="flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 transition-all duration-220 ease-out"
              style={{
                borderColor: isSelected ? dimColor : 'var(--color-humanos-border-strong)',
                background: isSelected ? dimColor : 'transparent',
              }}
            >
              <div
                className="w-2 h-2 rounded-full bg-white transition-all duration-220 ease-out"
                style={{
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected ? 'scale(1)' : 'scale(0.5)',
                }}
              />
            </div>
            <span className="text-left">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
