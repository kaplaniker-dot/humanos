// src/app/(app)/assessment/[id]/step/[stepNumber]/StepClient.tsx
// Client Component: state + soru render + auto-save + navigation
// Conversation Mode — paper theme, dimension-aware
// D5 — Bitir butonu /complete sayfasına yönlendiriyor

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  dimensionLabels,
  type Dimension,
  type Question,
  type QuestionAnswer,
} from '@/lib/assessment/questions'
import { saveStepAnswers } from '@/lib/assessment/actions'
import { QuestionRenderer } from '@/components/assessment/QuestionRenderer'
import { ProgressLine } from '@/components/ui/ProgressLine'
import { BreathOrb } from '@/components/ui/BreathOrb'
import { DimensionSymbol } from '@/components/ui/DimensionSymbol'
import { Button } from '@/components/ui/Button'

type AnswersMap = Record<string, QuestionAnswer>

type StepClientProps = {
  assessmentId: string
  currentStep: number
  totalSteps: number
  dimension: Dimension
  questions: Question[]
  initialAnswers?: AnswersMap
}

const dimensionColorVar: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  exercise: 'var(--color-dim-exercise)',
  blood: 'var(--color-dim-blood)',
  habits: 'var(--color-dim-habits)',
}

export function StepClient({
  assessmentId,
  currentStep,
  totalSteps,
  dimension,
  questions,
  initialAnswers,
}: StepClientProps) {
  const router = useRouter()
  const dimLabel = dimensionLabels[dimension]
  const dimColor = dimensionColorVar[dimension]

  const safeQuestions = questions ?? []

  const [answers, setAnswers] = useState<AnswersMap>(initialAnswers ?? {})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1

  function handleAnswerChange(questionId: string, newValue: QuestionAnswer) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: newValue,
    }))
    if (errorMsg) setErrorMsg(null)
  }

  // ─── Save + Navigate helper ───
  function saveAndNavigate(direction: 'next' | 'prev') {
    setErrorMsg(null)

    startTransition(async () => {
      const result = await saveStepAnswers({
        assessmentId,
        dimension,
        stepNumber: currentStep,
        answers,
        isLastStep: isLastStep && direction === 'next',
      })

      if (!result.success) {
        setErrorMsg(result.error)
        return
      }

      // Başarılı kayıt sonrası yönlendirme
      if (direction === 'next') {
        if (isLastStep) {
          router.push(`/assessment/${assessmentId}/complete`)
        } else {
          router.push(`/assessment/${assessmentId}/step/${currentStep + 1}`)
        }
      } else {
        router.push(`/assessment/${assessmentId}/step/${currentStep - 1}`)
      }
    })
  }

  // ─── Edge case: hiç soru yok ───
  if (safeQuestions.length === 0) {
    console.error('StepClient: questions array boş veya undefined', {
      assessmentId,
      dimension,
      currentStep,
    })

    return (
      <div className="relative min-h-screen bg-humanos-bg">
        <ProgressLine current={currentStep} total={totalSteps} />
        <div className="mx-auto max-w-[580px] px-6 pt-24 pb-16 text-center">
          <h1 className="font-serif text-3xl text-humanos-text mb-4">
            Bu boyut için soru bulunamadı.
          </h1>
          <p className="text-humanos-text-muted mb-8">
            Yeni bir analiz başlatmak ister misin?
          </p>
          <Button
            variant="primary"
            arrow="right"
            onClick={() => {
              window.location.href = '/assessment/start'
            }}
          >
            Yeniden başlat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-humanos-bg">
      {/* Sticky progress line */}
      <ProgressLine current={currentStep} total={totalSteps} />

      {/* Ambient background orb */}
      <BreathOrb
        color={dimColor}
        position="top-left"
        size={500}
        opacity={0.18}
      />

      {/* Content */}
      <div className="relative mx-auto max-w-[580px] px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2.5 mb-6 text-xs font-medium uppercase tracking-[0.08em] text-humanos-text-muted">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ background: dimColor }}
            />
            <span>
              Adım {currentStep} / {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <DimensionSymbol dimension={dimension} size={36} />
            <h1 className="font-serif font-normal text-5xl leading-none tracking-tight text-humanos-text">
              {dimLabel}
            </h1>
          </div>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-14 mb-16">
          {safeQuestions.map((question, idx) => (
            <div key={question.id} className="relative">
              {idx > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-humanos-border-strong" />
                </div>
              )}
              <QuestionRenderer
                question={question}
                dimension={dimension}
                value={answers[question.id] ?? null}
                onChange={(newValue) =>
                  handleAnswerChange(question.id, newValue)
                }
              />
            </div>
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div
            className="mb-6 px-4 py-3 rounded-xl border text-sm"
            style={{
              borderColor: 'var(--color-humanos-rose)',
              background: 'rgba(168, 85, 107, 0.08)',
              color: 'var(--color-humanos-rose)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-humanos-border-faint">
          <Button
            variant="ghost"
            arrow="left"
            disabled={isFirstStep || isPending}
            onClick={() => saveAndNavigate('prev')}
          >
            Önceki
          </Button>

          <Button
            variant="primary"
            arrow="right"
            disabled={isPending}
            onClick={() => saveAndNavigate('next')}
          >
            {isPending
              ? 'Kaydediliyor…'
              : isLastStep
                ? 'Bitir'
                : 'Sonraki'}
          </Button>
        </div>
      </div>
    </div>
  )
}
