// scripts/migrate-ai-reports-to-content-items.ts
// Day 14.2 — ai_reports → content_items migration
//
// Akış:
// 1. ai_reports tablosundan tüm satırları çek
// 2. Her satır için content_items'ta zaten var mı kontrol et (idempotency)
// 3. Yoksa, content_items'a INSERT et (content_type='report', source tracking ile)
// 4. Sonuç raporu (kaç satır işlendi, kaç yeni eklendi, kaç atlandı)
//
// Kullanım:
//   npx tsx scripts/migrate-ai-reports-to-content-items.ts
//   npx tsx scripts/migrate-ai-reports-to-content-items.ts --dry-run
//
// Idempotency: Aynı script tekrar çalıştırılırsa sıfır yeni satır eklenir.
// content_items'taki UNIQUE INDEX (source_table + source_id) garanti altına alır.
//
// Day 14 disiplini: ai_reports tablosuna DOKUNULMAZ. Sadece kopyalama.
// Day 16+'da migration onaylanınca ai_reports archived/dropped olur.

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// .env.local yükle
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ENV vars eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

// Service Role Client — RLS bypass (Day 12 pattern'i)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================
// AI_REPORTS ROW TYPE (Day 11-12 schema)
// ============================================================

type AiReportRow = {
  id: string
  user_id: string
  assessment_id: string | null
  status: 'pending_review' | 'approved' | 'rejected' | 'delivered'
  mira_version: string | null
  report_prompt_version: string | null
  content_json: Record<string, unknown> | null
  raw_response: string | null
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: number | null
  timing_ms: number | null
  admin_notes: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_reason: string | null
  delivered_at: string | null
  created_at: string
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🌱 Day 14.2 — ai_reports → content_items migration')
  console.log('━'.repeat(60))
  if (DRY_RUN) {
    console.log('🔍 DRY RUN — hiçbir kayıt eklenmeyecek, sadece rapor.')
  }
  console.log()

  // ─── 1. ai_reports'taki tüm satırları çek ───
  const { data: reports, error: fetchError } = await supabase
    .from('ai_reports')
    .select('*')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('❌ ai_reports fetch hatası:', fetchError.message)
    process.exit(1)
  }

  if (!reports || reports.length === 0) {
    console.log('ℹ️  ai_reports tablosu boş. Yapılacak iş yok.')
    return
  }

  console.log(`📊 ai_reports tablosunda ${reports.length} satır bulundu.`)
  console.log()

  // ─── 2. content_items'ta zaten migrate edilmiş olanları çek ───
  const { data: alreadyMigrated, error: existingError } = await supabase
    .from('content_items')
    .select('source_id')
    .eq('source_table', 'ai_reports')

  if (existingError) {
    console.error('❌ content_items mevcut migration kontrol hatası:', existingError.message)
    process.exit(1)
  }

  const migratedIds = new Set((alreadyMigrated ?? []).map((r) => r.source_id))
  console.log(`📋 content_items'ta zaten migrate edilmiş: ${migratedIds.size} satır.`)
  console.log()

  // ─── 3. Her satır için işle ───
  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const report of reports as AiReportRow[]) {
    const isAlreadyMigrated = migratedIds.has(report.id)

    if (isAlreadyMigrated) {
      console.log(`⏭️  ${report.id.slice(0, 8)} — zaten migrate edilmiş, atlandı.`)
      skipped++
      continue
    }

    // content_json polymorphic payload — ai_reports'tan birebir taşınır,
    // assessment_id de payload'a eklenir (referans için, parent_content_id ileride)
    const contentJson = {
      ...report.content_json,
      _source: {
        original_table: 'ai_reports',
        original_id: report.id,
        assessment_id: report.assessment_id,
        admin_notes: report.admin_notes,
      },
    }

    // generation_metadata — üretim takibi (token, cost, timing)
    const generationMetadata = {
      mira_version: report.mira_version,
      report_prompt_version: report.report_prompt_version,
      input_tokens: report.input_tokens,
      output_tokens: report.output_tokens,
      cost_usd: report.cost_usd,
      timing_ms: report.timing_ms,
      // raw_response büyük olabilir, ayrı tutalım
      has_raw_response: !!report.raw_response,
    }

    // Title — content_json'dan opening cümlesi veya fallback
    const opening = (report.content_json as { opening?: string })?.opening
    const title = opening
      ? opening.slice(0, 100) + (opening.length > 100 ? '...' : '')
      : `Yaşam Analizi Raporu — ${new Date(report.created_at).toLocaleDateString('tr-TR')}`

    const newRow = {
      user_id: report.user_id,
      content_type: 'report' as const,
      title,
      content_json: contentJson,
      status: report.status,
      generated_by: report.mira_version
        ? `mira:${report.mira_version}`
        : 'mira:unknown',
      generation_metadata: generationMetadata,
      approved_by: report.approved_by,
      approved_at: report.approved_at,
      rejected_reason: report.rejected_reason,
      delivered_at: report.delivered_at,
      source_table: 'ai_reports',
      source_id: report.id,
      created_at: report.created_at,
      // updated_at trigger ile otomatik
      // version default 1
      // parent_content_id null (Day 18+ diet/exercise eklenince bağlanacak)
    }

    if (DRY_RUN) {
      console.log(`🔍 ${report.id.slice(0, 8)} — eklenecekti (status: ${report.status})`)
      inserted++
      continue
    }

    const { error: insertError } = await supabase
      .from('content_items')
      .insert(newRow)

    if (insertError) {
      console.error(`❌ ${report.id.slice(0, 8)} — INSERT hatası:`, insertError.message)
      failed++
      continue
    }

    console.log(`✅ ${report.id.slice(0, 8)} — migrate edildi (status: ${report.status})`)
    inserted++
  }

  // ─── 4. Sonuç raporu ───
  console.log()
  console.log('━'.repeat(60))
  console.log('📊 Migration sonucu:')
  console.log(`   ${inserted} yeni satır eklendi`)
  console.log(`   ${skipped} atlandı (zaten migrate edilmiş)`)
  console.log(`   ${failed} başarısız`)
  console.log()

  if (failed > 0) {
    console.log('⚠️  Bazı satırlar başarısız oldu. Yukarıdaki hata mesajlarını kontrol et.')
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('🔍 DRY RUN tamamlandı. Gerçek migration için --dry-run flag\'i kaldır.')
  } else {
    console.log('🌱 Migration başarılı.')
  }
}

main().catch((err) => {
  console.error('💥 Beklenmeyen hata:', err)
  process.exit(1)
})
