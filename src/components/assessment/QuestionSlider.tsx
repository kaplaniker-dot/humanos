// src/components/assessment/QuestionSlider.tsx
// Kayar bar — paper theme, dimension-aware
// minLabel/maxLabel desteği — duygusal slider'lar için
// Conversation Mode

'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  SliderQuestion,
  Dimension,
} from '@/lib/assessment/questions'

type Props = {
  question: SliderQuestion
  dimension: Dimension
  value: number | null
  onChange: (newValue: number) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function QuestionSlider({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]
  const currentValue = value ?? (question.min + question.max) / 2

  // Heartbeat animation trigger
  const [beatKey, setBeatKey] = useState(0)
  const previousValue = useRef(currentValue)

  useEffect(() => {
    if (previousValue.current !== currentValue) {
      previousValue.current = currentValue
      setBeatKey((k) => k + 1)
    }
  }, [currentValue])

  // Min/Max etiketlerini hazırla
  const minDisplay = question.minLabel
    ? question.minLabel
    : `${question.min}${question.unit ? ` ${question.unit}` : ''}`

  const maxDisplay = question.maxLabel
    ? question.maxLabel
    : `${question.max}${question.unit ? ` ${question.unit}` : ''}`

  return (
    <div className="flex flex-col gap-12">
      {/* Big value display */}
      <div className="text-center">
        <span
          key={beatKey}
          className="font-serif font-normal text-[96px] leading-none tracking-tight inline-block animate-heartbeat"
          style={{ color: dimColor }}
        >
          {currentValue}
        </span>
        {question.unit && (
          <span className="font-serif italic font-light text-[28px] text-humanos-text-muted ml-3">
            {question.unit}
          </span>
        )}
      </div>

      {/* Slider track */}
      <div>
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step}
          value={currentValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-humanos-border focus:outline-none"
          style={{
            background: `linear-gradient(to right, ${dimColor} 0%, ${dimColor} ${
              ((currentValue - question.min) /
                (question.max - question.min)) *
              100
            }%, var(--color-humanos-border) ${
              ((currentValue - question.min) /
                (question.max - question.min)) *
              100
            }%, var(--color-humanos-border) 100%)`,
          }}
        />

        {/* Min / Max labels */}
        <div className="flex justify-between items-baseline mt-4 text-xs text-humanos-text-subtle font-medium">
          <span className={question.minLabel ? 'italic' : 'font-mono'}>
            {minDisplay}
          </span>
          <span className={question.maxLabel ? 'italic' : 'font-mono'}>
            {maxDisplay}
          </span>
        </div>
      </div>

      {/* Slider thumb styling — inline because dynamic color */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${dimColor};
          cursor: pointer;
          border: 4px solid var(--color-humanos-bg);
          box-shadow:
            0 0 0 1px ${dimColor},
            0 4px 12px rgba(26, 24, 20, 0.06);
          transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type='range']::-webkit-slider-thumb:active {
          transform: scale(1.35);
        }
        input[type='range']::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${dimColor};
          cursor: pointer;
          border: 4px solid var(--color-humanos-bg);
          box-shadow:
            0 0 0 1px ${dimColor},
            0 4px 12px rgba(26, 24, 20, 0.06);
        }
      `}</style>
    </div>
  )
}
