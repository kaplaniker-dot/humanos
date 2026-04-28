// src/components/assessment/QuestionMultiSelect.tsx
// Çoklu seçimli soru — paper theme, dimension-aware
// allowOther desteği: "Diğer" seçilince custom text input açılır
// Conversation Mode

'use client'

import { useState, useEffect } from 'react'
import type {
  MultiSelectQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: MultiSelectQuestion
  dimension: Dimension
  value: string[] | null
  onChange: (newValue: string[]) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

const OTHER_PREFIX = 'other:'

export function QuestionMultiSelect({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]
  const selectedValues = value ?? []

  // "Diğer" değeri ayrı tut: 'other:KULLANICI_METNİ' formatında saklanır
  const otherValue = selectedValues.find((v) => v.startsWith(OTHER_PREFIX))
  const otherText = otherValue ? otherValue.slice(OTHER_PREFIX.length) : ''
  const isOtherActive = otherValue !== undefined

  // Local state — kullanıcı yazarken anlık tutmak için
  const [otherInput, setOtherInput] = useState(otherText)

  // Eğer dışarıdan value değişirse local state'i senkronize et
  useEffect(() => {
    setOtherInput(otherText)
  }, [otherText])

  function toggleOption(optionValue: string) {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue))
    } else {
      onChange([...selectedValues, optionValue])
    }
  }

  function toggleOther() {
    if (isOtherActive) {
      // "Diğer" iptal — other entry'sini çıkar
      onChange(selectedValues.filter((v) => !v.startsWith(OTHER_PREFIX)))
      setOtherInput('')
    } else {
      // "Diğer" aktive — boş entry ekle
      onChange([...selectedValues, OTHER_PREFIX])
    }
  }

  function updateOtherText(newText: string) {
    setOtherInput(newText)
    // Mevcut other'ı çıkar, yenisiyle değiştir
    const withoutOther = selectedValues.filter(
      (v) => !v.startsWith(OTHER_PREFIX),
    )
    onChange([...withoutOther, OTHER_PREFIX + newText])
  }

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option) => {
        const isSelected = selectedValues.includes(option.value)

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-humanos-surface text-[15px] text-humanos-text font-sans cursor-pointer transition-all duration-220 ease-out hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(26,24,20,0.04)]"
            style={{
              borderColor: isSelected ? dimColor : 'var(--color-humanos-border)',
              background: isSelected
                ? `linear-gradient(to right, ${dimColor}10, ${dimColor}04)`
                : 'var(--color-humanos-surface)',
            }}
          >
            <div
              className="flex items-center justify-center w-[22px] h-[22px] rounded-md border-2 flex-shrink-0 transition-all duration-220 ease-out"
              style={{
                borderColor: isSelected
                  ? dimColor
                  : 'var(--color-humanos-border-strong)',
                background: isSelected ? dimColor : 'transparent',
              }}
            >
              <svg
                className="w-3 h-3 text-white transition-all duration-220 ease-out"
                style={{
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected ? 'scale(1)' : 'scale(0.5)',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-left">{option.label}</span>
          </button>
        )
      })}

      {/* "Diğer" seçeneği — sadece allowOther varsa */}
      {question.allowOther && (
        <>
          <button
            type="button"
            onClick={toggleOther}
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-humanos-surface text-[15px] text-humanos-text font-sans cursor-pointer transition-all duration-220 ease-out hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(26,24,20,0.04)]"
            style={{
              borderColor: isOtherActive
                ? dimColor
                : 'var(--color-humanos-border)',
              background: isOtherActive
                ? `linear-gradient(to right, ${dimColor}10, ${dimColor}04)`
                : 'var(--color-humanos-surface)',
            }}
          >
            <div
              className="flex items-center justify-center w-[22px] h-[22px] rounded-md border-2 flex-shrink-0 transition-all duration-220 ease-out"
              style={{
                borderColor: isOtherActive
                  ? dimColor
                  : 'var(--color-humanos-border-strong)',
                background: isOtherActive ? dimColor : 'transparent',
              }}
            >
              <svg
                className="w-3 h-3 text-white transition-all duration-220 ease-out"
                style={{
                  opacity: isOtherActive ? 1 : 0,
                  transform: isOtherActive ? 'scale(1)' : 'scale(0.5)',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-left italic text-humanos-text-muted">
              Diğer (yazarak ekle)
            </span>
          </button>

          {/* Input — sadece "Diğer" aktif ise */}
          {isOtherActive && (
            <input
              type="text"
              value={otherInput}
              onChange={(e) => updateOtherText(e.target.value)}
              placeholder="Kendi durumunu yaz..."
              maxLength={150}
              className="ml-10 mt-1 px-4 py-3 rounded-xl border-2 bg-humanos-surface text-humanos-text font-sans text-sm transition-all duration-220 ease-out focus:outline-none placeholder:text-humanos-text-subtle placeholder:italic"
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
              autoFocus
            />
          )}
        </>
      )}
    </div>
  )
}
