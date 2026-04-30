// src/lib/assessment/actions.ts
// Server Actions for assessment form
// Day 10 Aşama D3a — saveStepAnswers
// Day 12 fix — status='completed' eklendi (Day 10 bug)
// (extractAnswersForDimension parse.ts'e taşındı)

'use server'

import { createClient } from '@/lib/supabase/server'
import {
  questionsByDimension,
  type Dimension,
  type Question,
  type QuestionAnswer,
} from './questions'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type AnswersMap = Record<string, QuestionAnswer>

type SaveStepResult =
  | { success: true }
  | { success: false; error: string }

type StructuredUpdate = Record<string, unknown>
type JsonbBucket = Record<string, unknown>
type JsonbUpdates = Record<string, JsonbBucket>

// ═══════════════════════════════════════════════════
// HELPERS — answer'ları DB shape'ine dönüştür
// ═══════════════════════════════════════════════════

function applyAnswerToUpdates(
  question: Question,
  answer: QuestionAnswer,
  structured: StructuredUpdate,
  jsonb: JsonbUpdates,
): void {
  if (answer === null || answer === undefined) return

  // ─── number_group ───
  if (question.type === 'number_group') {
    if (
      typeof answer !== 'object' ||
      Array.isArray(answer) ||
      'primary' in answer
    ) {
      return
    }

    const groupAnswer = answer as Record<string, number | null>

    for (const field of question.fields) {
      const fieldValue = groupAnswer[field.id]
      if (fieldValue === null || fieldValue === undefined) continue

      if (field.db.kind === 'structured') {
        structured[field.db.column] = fieldValue
      } else {
        if (!jsonb[field.db.column]) jsonb[field.db.column] = {}
        jsonb[field.db.column][field.db.key] = fieldValue
      }
    }
    return
  }

  // ─── paired_select ───
  if (question.type === 'paired_select') {
    if (
      typeof answer !== 'object' ||
      Array.isArray(answer) ||
      !('primary' in answer)
    ) {
      return
    }

    const pairedAnswer = answer as {
      primary: string
      secondary: string | null
    }

    if (question.db.kind === 'structured') {
      structured[question.db.column] = pairedAnswer.primary
    } else {
      if (!jsonb[question.db.column]) jsonb[question.db.column] = {}
      jsonb[question.db.column][question.db.key] = pairedAnswer.primary
    }

    if (pairedAnswer.secondary !== null) {
      if (question.secondaryDb.kind === 'structured') {
        structured[question.secondaryDb.column] = pairedAnswer.secondary
      } else {
        if (!jsonb[question.secondaryDb.column])
          jsonb[question.secondaryDb.column] = {}
        jsonb[question.secondaryDb.column][question.secondaryDb.key] =
          pairedAnswer.secondary
      }
    }
    return
  }

  // ─── Diğer tipler ───
  if (question.db.kind === 'structured') {
    structured[question.db.column] = answer
  } else {
    if (!jsonb[question.db.column]) jsonb[question.db.column] = {}
    jsonb[question.db.column][question.db.key] = answer
  }
}

// ═══════════════════════════════════════════════════
// ACTION: saveStepAnswers
// ═══════════════════════════════════════════════════

export async function saveStepAnswers(params: {
  assessmentId: string
  dimension: Dimension
  stepNumber: number
  answers: AnswersMap
  isLastStep: boolean
}): Promise<SaveStepResult> {
  const { assessmentId, dimension, stepNumber, answers, isLastStep } = params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Oturum bulunamadı.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('life_assessments')
    .select('user_id, nutrition_details, exercise_details, bloodwork_details, habits_details')
    .eq('id', assessmentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Analiz bulunamadı.' }
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: 'Yetki yok.' }
  }

  const structured: StructuredUpdate = {}
  const jsonbAdditions: JsonbUpdates = {}

  const dimensionQuestions = questionsByDimension[dimension] ?? []

  for (const question of dimensionQuestions) {
    const answer = answers[question.id]
    if (answer !== undefined) {
      applyAnswerToUpdates(question, answer, structured, jsonbAdditions)
    }
  }

  const existingDetails = {
    nutrition_details: existing.nutrition_details ?? {},
    exercise_details: existing.exercise_details ?? {},
    bloodwork_details: existing.bloodwork_details ?? {},
    habits_details: existing.habits_details ?? {},
  } as Record<string, JsonbBucket>

  const mergedJsonb: Record<string, JsonbBucket> = { ...existingDetails }

  for (const column of Object.keys(jsonbAdditions)) {
    mergedJsonb[column] = {
      ...(existingDetails[column] ?? {}),
      ...jsonbAdditions[column],
    }
  }

  const updatePayload: Record<string, unknown> = {
    ...structured,
    ...mergedJsonb,
    current_step: stepNumber,
    updated_at: new Date().toISOString(),
  }

  if (isLastStep) {
    updatePayload.completed_at = new Date().toISOString()
    updatePayload.status = 'completed'
  }

  const { error: updateError } = await supabase
    .from('life_assessments')
    .update(updatePayload)
    .eq('id', assessmentId)

  if (updateError) {
    console.error('saveStepAnswers update error:', updateError)
    return { success: false, error: 'Kaydetme sırasında hata oluştu.' }
  }

  return { success: true }
}
