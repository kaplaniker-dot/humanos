// src/app/(app)/assessment/[id]/step/[stepNumber]/page.tsx
// Server Component: auth + DB fetch + step validation + initial answers
// Day 10 Aşama D3b — initialAnswers refresh-safe state

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getQuestionsForStep,
  getTotalSteps,
  type Dimension,
} from '@/lib/assessment/questions'
import { extractAnswersForDimension } from '@/lib/assessment/parse'
import { StepClient } from './StepClient'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type PageProps = {
  params: Promise<{
    id: string
    stepNumber: string
  }>
}

// ═══════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════

export default async function AssessmentStepPage({ params }: PageProps) {
  // 1. URL parametrelerini al
  const { id, stepNumber } = await params

  // 2. Auth kontrolü
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // 3. stepNumber'ı parse et (string -> number)
  const parsedStep = parseInt(stepNumber, 10)
  if (isNaN(parsedStep) || parsedStep < 1) {
    redirect(`/assessment/${id}/step/1`)
  }

  // 4. Assessment'ı DB'den çek (tüm kolonlar — initialAnswers için gerekli)
  const { data: assessment, error } = await supabase
    .from('life_assessments')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !assessment) {
    console.error('Assessment fetch error:', error)
    redirect('/dashboard')
  }

  // 5. Sahiplik kontrolü
  if (assessment.user_id !== user.id) {
    redirect('/dashboard')
  }

  // 6. selected_dimensions array kontrolü
  const selectedDims = (assessment.selected_dimensions ?? []) as Dimension[]
  if (selectedDims.length === 0) {
    redirect('/assessment/start')
  }

  // 7. Total steps + bound check
  const totalSteps = getTotalSteps(selectedDims)
  if (parsedStep > totalSteps) {
    redirect(`/assessment/${id}/step/1`)
  }

  // 8. Bu step için boyut + sorular
  const stepData = getQuestionsForStep(selectedDims, parsedStep)
  if (!stepData) {
    redirect(`/assessment/${id}/step/1`)
  }

  // 9. 🆕 DB'den bu boyut için kayıtlı cevapları çek
  const initialAnswers = extractAnswersForDimension(
    assessment,
    stepData.dimension,
  )

  // 10. StepClient'a aktar
  return (
    <StepClient
      assessmentId={id}
      currentStep={parsedStep}
      totalSteps={totalSteps}
      dimension={stepData.dimension}
      questions={stepData.questions}
      initialAnswers={initialAnswers}
    />
  )
}
