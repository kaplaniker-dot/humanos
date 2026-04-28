// src/components/assessment/QuestionRenderer.tsx
// Orchestrator: question.type'a göre doğru component'i seçer
// Conversation Mode — dimension-aware
// 8 tip desteği: single_select, multi_select, slider, number, date,
//                textarea, number_group, paired_select

'use client'

import type {
  Question,
  QuestionAnswer,
  Dimension,
} from '@/lib/assessment/questions'
import { QuestionSingleSelect } from './QuestionSingleSelect'
import { QuestionMultiSelect } from './QuestionMultiSelect'
import { QuestionSlider } from './QuestionSlider'
import { QuestionNumber } from './QuestionNumber'
import { QuestionDate } from './QuestionDate'
import { QuestionTextarea } from './QuestionTextarea'
import { QuestionNumberGroup } from './QuestionNumberGroup'
import { QuestionPairedSelect } from './QuestionPairedSelect'

type Props = {
  question: Question
  dimension: Dimension
  value: QuestionAnswer
  onChange: (newValue: QuestionAnswer) => void
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

// Type guards — runtime'da value'nun beklenen tipte olup olmadığını kontrol eder
function isPairedValue(
  v: QuestionAnswer,
): v is { primary: string; secondary: string | null } {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    'primary' in v &&
    'secondary' in v
  )
}

function isNumberGroupValue(
  v: QuestionAnswer,
): v is Record<string, number | null> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !('primary' in v)
  )
}

export function QuestionRenderer({
  question,
  dimension,
  value,
  onChange,
}: Props) {
  const dimColor = dimensionColorVar[dimension]

  return (
    <div className="flex flex-col gap-5">
      {/* Soru başlığı */}
      <div>
        <h3 className="font-serif font-normal text-2xl leading-tight tracking-tight text-humanos-text">
          {question.label}
          {question.required && (
            <span className="ml-1.5" style={{ color: dimColor }}>
              *
            </span>
          )}
        </h3>
        {question.help && (
          <p className="mt-2 text-sm italic text-humanos-text-muted leading-relaxed">
            {question.help}
          </p>
        )}
      </div>

      {/* Soru tipi → ilgili component */}
      <div className="pt-2">
        {question.type === 'single_select' && (
          <QuestionSingleSelect
            question={question}
            dimension={dimension}
            value={typeof value === 'string' ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'multi_select' && (
          <QuestionMultiSelect
            question={question}
            dimension={dimension}
            value={Array.isArray(value) ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'slider' && (
          <QuestionSlider
            question={question}
            dimension={dimension}
            value={typeof value === 'number' ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'number' && (
          <QuestionNumber
            question={question}
            dimension={dimension}
            value={typeof value === 'number' ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'date' && (
          <QuestionDate
            question={question}
            dimension={dimension}
            value={typeof value === 'string' ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'textarea' && (
          <QuestionTextarea
            question={question}
            dimension={dimension}
            value={typeof value === 'string' ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'number_group' && (
          <QuestionNumberGroup
            question={question}
            dimension={dimension}
            value={isNumberGroupValue(value) ? value : null}
            onChange={onChange}
          />
        )}

        {question.type === 'paired_select' && (
          <QuestionPairedSelect
            question={question}
            dimension={dimension}
            value={isPairedValue(value) ? value : null}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  )
}
