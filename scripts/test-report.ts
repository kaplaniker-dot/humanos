// scripts/test-report.ts
// Day 11 — Gerçek rapor üretim testi
// Usage: npx tsx scripts/test-report.ts <assessment_id>

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

// .env.local dosyasını yükle (import'lardan ÖNCE)
config({ path: resolve(process.cwd(), '.env.local') })

// Sonra import
import { createClient } from '@supabase/supabase-js'
import { generatePremiumReport } from '../src/lib/mira/report-generator'
import type { AssessmentRow } from '../src/lib/assessment/parse'

// ═══════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════

const ASSESSMENT_ID = process.argv[2]

if (!ASSESSMENT_ID) {
  console.error('❌ Usage: npx tsx scripts/test-report.ts <assessment_id>')
  console.error('')
  console.error('   Example:')
  console.error('   npx tsx scripts/test-report.ts 450c28e7-6b62-4765-b753-d04460ea51e8')
  process.exit(1)
}

// ═══════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log('🌱 humanOS — Mira Test Report Generator')
  console.log(`   Assessment ID: ${ASSESSMENT_ID}`)
  console.log('')

  // ─── Step 1: Fetch assessment ───
  console.log('📥 Fetching assessment from Supabase...')
  const { data: assessment, error: fetchErr } = await supabase
    .from('life_assessments')
    .select('*')
    .eq('id', ASSESSMENT_ID)
    .single()

  if (fetchErr || !assessment) {
    console.error('❌ Failed to fetch assessment:', fetchErr?.message ?? 'not found')
    process.exit(1)
  }

  console.log(`   ✓ Status: ${assessment.status}`)
  console.log(`   ✓ Selected dimensions: ${JSON.stringify(assessment.selected_dimensions)}`)
  console.log(`   ✓ Age: ${assessment.age}, Gender: ${assessment.gender}`)
  console.log('')

  // ─── Step 2: Generate report ───
  console.log('🧠 Sending to Mira (Sonnet 4.6)...')
  console.log('   This may take 15-25 seconds. Be patient.')
  console.log('')

  const result = await generatePremiumReport(
    assessment as AssessmentRow,
    'İlker', // userName — ileride profile'dan alınacak
  )

  // ─── Step 3: Output ───
  if (!result.success) {
    console.error(`❌ Generation failed: ${result.error}`)
    if (result.raw_response) {
      console.error('Raw response:')
      console.error(result.raw_response.substring(0, 500) + '...')
    }
    process.exit(1)
  }

  console.log(`✅ SUCCESS in ${result.timing_ms}ms`)
  console.log('')
  console.log('📊 Stats:')
  console.log(`   Input tokens:  ${result.input_tokens.toLocaleString()}`)
  console.log(`   Output tokens: ${result.output_tokens.toLocaleString()}`)
  console.log(`   Cost:          $${result.cost_usd.toFixed(4)}`)
  console.log(`   Mira version:  ${result.mira_version}`)
  console.log(`   Prompt ver:    ${result.report_prompt_version}`)
  console.log('')

  // ─── Save outputs ───
  mkdirSync('output', { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)

  // Full JSON
  const jsonPath = `output/report-${timestamp}.json`
  writeFileSync(jsonPath, JSON.stringify(result, null, 2))
  console.log(`💾 JSON: ${jsonPath}`)

  // Human-readable Markdown
  const mdPath = `output/report-${timestamp}.md`
  const md = renderReportAsMarkdown(result.report)
  writeFileSync(mdPath, md)
  console.log(`💾 Markdown: ${mdPath}`)
  console.log('')
  console.log('🎉 Open the .md file to read Mira\'s report.')
}

// ═══════════════════════════════════════════════════
// MARKDOWN RENDERER
// ═══════════════════════════════════════════════════

function renderReportAsMarkdown(report: any): string {
  const s = report.sections
  const lines: string[] = []

  lines.push(`# humanOS · Mira'nın Raporu`)
  lines.push('')
  lines.push(`## ${report.user_name} · ${report.report_date}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### Açılış')
  lines.push('')
  lines.push(s.opening)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### Mevcut Durumun')
  lines.push('')
  lines.push('**Güçlü olduğun alanlar:**')
  lines.push('')
  s.current_state.strengths.forEach((str: string) => {
    lines.push(`- ${str}`)
  })
  lines.push('')
  lines.push('**Dikkat etmemiz gereken alanlar:**')
  lines.push('')
  s.current_state.watch_areas.forEach((str: string) => {
    lines.push(`- ${str}`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### Önemli Bir Pattern')
  lines.push('')
  lines.push(s.pattern)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### Bu Hafta Önceliğin')
  lines.push('')
  lines.push(`**Ana hedef:** ${s.priority_map.main_goal}`)
  lines.push('')
  lines.push(`**Ana eylem:** ${s.priority_map.main_action}`)
  lines.push('')
  lines.push(`**Destek 1:** ${s.priority_map.support_1}`)
  lines.push('')
  lines.push(`**Destek 2:** ${s.priority_map.support_2}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### 7 Günlük Plan')
  lines.push('')
  lines.push('| Gün | Eylem | Süre |')
  lines.push('|-----|-------|------|')
  s.weekly_plan.forEach((day: any) => {
    lines.push(`| ${day.day} | ${day.action} | ${day.duration_min} dk |`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('### Kapanış')
  lines.push('')
  lines.push(s.closing)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(`*${s.medical_disclaimer}*`)
  lines.push('')

  return lines.join('\n')
}

main().catch((err) => {
  console.error('💥 Crash:', err)
  process.exit(1)
})
