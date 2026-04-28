// src/lib/assessment/parse.ts
// Pure utility — DB shape <-> AnswersMap conversion
// NOT a Server Action (no 'use server' directive)
// Day 10 D3b — initial answers parser
// DB schema uyumlu: nutrition_primary_diet, habits_smoking_status, habits_alcohol_frequency

import {
  questionsByDimension,
  type Dimension,
  type QuestionAnswer,
} from './questions'

type AnswersMap = Record<string, QuestionAnswer>

export type AssessmentRow = {
  // Demographic (yeni)
  gender?: string | null
  age?: number | null
  height_cm?: number | null
  weight_kg?: number | null

  // Day 9 structured columns (mevcut)
  nutrition_meals_per_day?: number | null
  nutrition_primary_diet?: string | null
  nutrition_water_liters?: number | null
  exercise_frequency_per_week?: number | null
  habits_smoking_status?: string | null
  habits_alcohol_frequency?: string | null

  // JSONB buckets
  nutrition_details?: Record<string, unknown> | null
  exercise_details?: Record<string, unknown> | null
  bloodwork_details?: Record<string, unknown> | null
  habits_details?: Record<string, unknown> | null
}

/**
 * DB satırından bir boyutun cevap haritasını çıkarır.
 * StepClient'a initialAnswers olarak geçilir.
 */
export function extractAnswersForDimension(
  assessment: AssessmentRow,
  dimension: Dimension,
): AnswersMap {
  const answers: AnswersMap = {}
  const dimensionQuestions = questionsByDimension[dimension] ?? []

  for (const question of dimensionQuestions) {
    // ─── number_group: alt field'ları ayrı ayrı topla ───
    if (question.type === 'number_group') {
      const groupValue: Record<string, number | null> = {}
      let hasAny = false

      for (const field of question.fields) {
        let fieldVal: unknown
        if (field.db.kind === 'structured') {
          fieldVal = assessment[field.db.column as keyof AssessmentRow]
        } else {
          const bucket = assessment[field.db.column as keyof AssessmentRow] as
            | Record<string, unknown>
            | null
            | undefined
          fieldVal = bucket?.[field.db.key]
        }

        if (typeof fieldVal === 'number') {
          groupValue[field.id] = fieldVal
          hasAny = true
        } else {
          groupValue[field.id] = null
        }
      }

      if (hasAny) answers[question.id] = groupValue
      continue
    }

    // ─── paired_select: primary + secondary'i topla ───
    if (question.type === 'paired_select') {
      let primaryVal: unknown
      let secondaryVal: unknown

      if (question.db.kind === 'structured') {
        primaryVal = assessment[question.db.column as keyof AssessmentRow]
      } else {
        const bucket = assessment[
          question.db.column as keyof AssessmentRow
        ] as Record<string, unknown> | null | undefined
        primaryVal = bucket?.[question.db.key]
      }

      if (question.secondaryDb.kind === 'structured') {
        secondaryVal =
          assessment[question.secondaryDb.column as keyof AssessmentRow]
      } else {
        const bucket = assessment[
          question.secondaryDb.column as keyof AssessmentRow
        ] as Record<string, unknown> | null | undefined
        secondaryVal = bucket?.[question.secondaryDb.key]
      }

      if (typeof primaryVal === 'string') {
        answers[question.id] = {
          primary: primaryVal,
          secondary: typeof secondaryVal === 'string' ? secondaryVal : null,
        }
      }
      continue
    }

    // ─── Diğer tipler: tek hedef ───
    let value: unknown
    if (question.db.kind === 'structured') {
      value = assessment[question.db.column as keyof AssessmentRow]
    } else {
      const bucket = assessment[question.db.column as keyof AssessmentRow] as
        | Record<string, unknown>
        | null
        | undefined
      value = bucket?.[question.db.key]
    }

    if (value !== null && value !== undefined) {
      answers[question.id] = value as QuestionAnswer
    }
  }

  return answers
}
