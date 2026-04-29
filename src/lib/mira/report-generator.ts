// src/lib/mira/report-generator.ts
// Premium AI rapor üretim orchestrator
// Day 11 V1
//
// Bu dosya:
// 1. DB'den assessment çeker
// 2. Profile context'i oluşturur
// 3. Anthropic API'ye Mira karakter prompt + rapor talimatı + user data gönderir
// 4. JSON cevabı parse eder ve döner

import { getAnthropicClient, MIRA_MODELS, MIRA_DEFAULTS } from './anthropic-client'
import { MIRA_CHARACTER_PROMPT, MIRA_VERSION } from './character'
import { PREMIUM_REPORT_PROMPT, REPORT_PROMPT_VERSION } from './report-prompt'
import {
  buildPremiumReportContext,
  ageBand,
  type UserContext,
} from './profile-builder'
import type { AssessmentRow } from '@/lib/assessment/parse'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

/**
 * Mira'nın ürettiği rapor JSON formatı.
 * report-prompt.ts'teki şemaya birebir uyar.
 */
export type MiraReport = {
  version: string
  user_name: string
  report_date: string
  sections: {
    opening: string
    current_state: {
      strengths: string[]
      watch_areas: string[]
    }
    pattern: string
    priority_map: {
      main_goal: string
      main_action: string
      support_1: string
      support_2: string
    }
    weekly_plan: Array<{
      day: string
      action: string
      duration_min: number
    }>
    closing: string
    medical_disclaimer: string
  }
  metadata: {
    total_word_count: number
    primary_hypothesis: string
    uncertainty_flags: string[]
    follow_up_questions: string[]
  }
}

export type GenerationResult =
  | {
      success: true
      report: MiraReport
      raw_response: string
      timing_ms: number
      input_tokens: number
      output_tokens: number
      cost_usd: number
      mira_version: string
      report_prompt_version: string
    }
  | {
      success: false
      error: string
      raw_response?: string
      timing_ms?: number
    }

// ═══════════════════════════════════════════════════
// COST CALCULATION
// ═══════════════════════════════════════════════════

// Sonnet 4.6 pricing (per 1M tokens)
// Input: $3.00, Output: $15.00
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 3.0
  const outputCost = (outputTokens / 1_000_000) * 15.0
  return inputCost + outputCost
}

// ═══════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════

/**
 * Premium AI rapor üretir.
 *
 * @param assessment - Day 10 form'dan DB row
 * @param userName - Kullanıcının adı (rapor için)
 * @returns GenerationResult — başarı veya hata
 */
export async function generatePremiumReport(
  assessment: AssessmentRow,
  userName: string,
): Promise<GenerationResult> {
  const start = Date.now()

  try {
    // ─── Profile context'i oluştur ───
    const userContext: UserContext = {
      userName,
      userAgeBand: ageBand(assessment.age),
    }
    const profileContext = buildPremiumReportContext(assessment, userContext)

    // ─── Anthropic API çağrısı ───
    const client = getAnthropicClient()
    const systemPrompt = `${MIRA_CHARACTER_PROMPT}\n\n${PREMIUM_REPORT_PROMPT}`

    const response = await client.messages.create({
      model: MIRA_MODELS.PREMIUM_REPORT,
      max_tokens: MIRA_DEFAULTS.REPORT_MAX_TOKENS,
      temperature: MIRA_DEFAULTS.REPORT_TEMPERATURE,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: profileContext,
        },
      ],
    })

    // ─── Cevabı al ───
    const content = response.content[0]
    if (content.type !== 'text') {
      return {
        success: false,
        error: 'Unexpected response type from Anthropic',
        timing_ms: Date.now() - start,
      }
    }

    const rawText = content.text

    // ─── JSON parse ───
    let report: MiraReport
    try {
      // Bazı durumlarda Claude markdown code block içinde dönerse temizle
      const cleanText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim()
      report = JSON.parse(cleanText)
    } catch (parseErr) {
      return {
        success: false,
        error: `JSON parse failed: ${parseErr instanceof Error ? parseErr.message : 'unknown'}`,
        raw_response: rawText,
        timing_ms: Date.now() - start,
      }
    }

    // ─── Cost calculation ───
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const cost = calculateCost(inputTokens, outputTokens)

    return {
      success: true,
      report,
      raw_response: rawText,
      timing_ms: Date.now() - start,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
      mira_version: MIRA_VERSION,
      report_prompt_version: REPORT_PROMPT_VERSION,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      timing_ms: Date.now() - start,
    }
  }
}
