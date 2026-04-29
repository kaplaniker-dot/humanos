// src/app/api/generate-report/route.ts
// POST /api/generate-report
// Day 11 V1 — Premium AI rapor üretim endpoint'i

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePremiumReport } from '@/lib/mira/report-generator'
import type { AssessmentRow } from '@/lib/assessment/parse'

// ═══════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════

// Bu endpoint AI üretim yapıyor — uzun sürebilir
export const maxDuration = 120 // 120 saniye (Vercel için)
export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════
// REQUEST BODY VALIDATION
// ═══════════════════════════════════════════════════

type GenerateReportBody = {
  assessment_id: string
}

function isValidBody(body: unknown): body is GenerateReportBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'assessment_id' in body &&
    typeof (body as GenerateReportBody).assessment_id === 'string'
  )
}

// ═══════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════

export async function POST(req: Request) {
  try {
    // ─── Step 1: Auth check ───
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 },
      )
    }

    // ─── Step 2: Body parse + validate ───
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'invalid_json' },
        { status: 400 },
      )
    }

    if (!isValidBody(body)) {
      return NextResponse.json(
        { success: false, error: 'invalid_body' },
        { status: 400 },
      )
    }

    const { assessment_id } = body

    // ─── Step 3: Fetch assessment + ownership check ───
    const { data: assessment, error: fetchErr } = await supabase
      .from('life_assessments')
      .select('*')
      .eq('id', assessment_id)
      .single()

    if (fetchErr || !assessment) {
      return NextResponse.json(
        { success: false, error: 'assessment_not_found' },
        { status: 404 },
      )
    }

    if (assessment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'forbidden' },
        { status: 403 },
      )
    }

    if (assessment.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'assessment_not_completed',
          status: assessment.status,
        },
        { status: 400 },
      )
    }

    // ─── Step 4: Idempotency — bu assessment için rapor var mı? ───
    const { data: existingReport } = await supabase
      .from('ai_reports')
      .select('id, status, created_at')
      .eq('assessment_id', assessment_id)
      .maybeSingle()

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'report_already_exists',
          existing_report_id: existingReport.id,
          existing_report_status: existingReport.status,
        },
        { status: 409 },
      )
    }

    // ─── Step 5: Get user name from profile ───
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, full_name')
      .eq('id', user.id)
      .single()

    const userName =
      profile?.display_name ||
      profile?.full_name ||
      user.email?.split('@')[0] ||
      'Kullanıcı'

    // ─── Step 6: Generate report (Mira çağrısı) ───
    const result = await generatePremiumReport(
      assessment as AssessmentRow,
      userName,
    )

    if (!result.success) {
      console.error('[generate-report] Mira generation failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: 'generation_failed',
          message: result.error,
        },
        { status: 500 },
      )
    }

    // ─── Step 7: Save to ai_reports table ───
    const { data: savedReport, error: insertErr } = await supabase
      .from('ai_reports')
      .insert({
        user_id: user.id,
        assessment_id,
        status: 'pending_review', // İlker onaylayana kadar pending
        mira_version: result.mira_version,
        report_prompt_version: result.report_prompt_version,
        content_json: result.report,
        raw_response: result.raw_response,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        cost_usd: result.cost_usd,
        timing_ms: result.timing_ms,
      })
      .select('id')
      .single()

    if (insertErr || !savedReport) {
      console.error('[generate-report] DB insert failed:', insertErr)
      return NextResponse.json(
        {
          success: false,
          error: 'db_insert_failed',
          message: insertErr?.message,
        },
        { status: 500 },
      )
    }

    // ─── Step 8: Success response ───
    return NextResponse.json({
      success: true,
      report_id: savedReport.id,
      report: result.report,
      stats: {
        timing_ms: result.timing_ms,
        cost_usd: result.cost_usd,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
      },
    })
  } catch (err) {
    console.error('[generate-report] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
