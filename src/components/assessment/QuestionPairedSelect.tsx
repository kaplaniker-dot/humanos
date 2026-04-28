// src/components/assessment/QuestionPairedSelect.tsx
// İki katmanlı seçim — birincil + ikincil hedef
// Conversation Mode — paper theme, dimension-aware

'use client'

import type {
  PairedSelectQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type PairedValue = {
  primary: string
  secondary: string | null
}

type Props = {
  question: PairedSelectQuestion
  dimension: Dimension
  value: PairedValue | null
  onChange: (newValue: PairedValue) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionPairedSelect({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]
  const currentPrimary = value?.primary ?? null
  const currentSecondary = value?.secondary ?? null

  function selectPrimary(newPrimary: string) {
    // Eğer ikincil aynı seçim ise sıfırla
    const nextSecondary =
      currentSecondary === newPrimary ? null : currentSecondary
    onChange({ primary: newPrimary, secondary: nextSecondary })
  }

  function selectSecondary(newSecondary: string | null) {
    if (!currentPrimary) return // Birincil seçilmemişse hiçbir şey yapma
    onChange({ primary: currentPrimary, secondary: newSecondary })
  }

  function renderOption(
    optionValue: string,
    optionLabel: string,
    isSelected: boolean,
    onClick: () => void,
    disabled: boolean = false,
  ) {
    return (
      <button
        key={optionValue}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-humanos-surface text-[15px] text-humanos-text font-sans cursor-pointer transition-all duration-220 ease-out hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(26,24,20,0.04)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
            borderColor: isSelected
              ? dimColor
              : 'var(--color-humanos-border-strong)',
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
        <span className="text-left">{optionLabel}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* PRIMARY */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-humanos-text-muted">
          {question.primaryLabel}
        </div>
        <div className="flex flex-col gap-2">
          {question.options.map((option) =>
            renderOption(
              option.value,
              option.label,
              currentPrimary === option.value,
              () => selectPrimary(option.value),
            ),
          )}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="relative h-px bg-humanos-border-faint">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-humanos-border-strong" />
      </div>

      {/* SECONDARY */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-humanos-text-muted">
          {question.secondaryLabel}
        </div>

        <div className="flex flex-col gap-2">
          {/* "Yok" seçeneği */}
          {renderOption(
            '__none__',
            'Yok, tek hedefim var',
            currentSecondary === null && currentPrimary !== null,
            () => selectSecondary(null),
            !currentPrimary,
          )}

          {/* Diğer seçenekler — birincil olarak seçilen hariç */}
          {question.options
            .filter((option) => option.value !== currentPrimary)
            .map((option) =>
              renderOption(
                option.value,
                option.label,
                currentSecondary === option.value,
                () => selectSecondary(option.value),
                !currentPrimary,
              ),
            )}
        </div>

        {!currentPrimary && (
          <p className="text-xs italic text-humanos-text-subtle mt-1">
            Önce birincil hedefini seç.
          </p>
        )}
      </div>
    </div>
  )
}
