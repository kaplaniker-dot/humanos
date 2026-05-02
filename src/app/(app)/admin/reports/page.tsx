// src/app/(app)/admin/reports/page.tsx
// Day 14.3.a — Admin: Pending Review Reports Listesi (content_items refactor)
//
// Day 12'den miras: Manuel batched fetch pattern (profiles için).
// Day 14: Query kaynağı ai_reports → content_items + content_type='report' filter.
//
// content_json polymorphic payload — eski ai_reports kolonları artık nested:
//   - generation_metadata.cost_usd, .timing_ms, .input_tokens, .output_tokens
//   - generation_metadata.mira_version
//   - content_json._source.assessment_id (Day 14.2 migration tracking)

import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type ContentItemRow = {
  id: string
  created_at: string
  status: string
  generated_by: string | null
  generation_metadata: Record<string, unknown> | null
  content_json: Record<string, unknown> | null
  user_id: string
}

type ProfileRow = {
  id: string
  full_name: string | null
}

type GenerationMetadata = {
  cost_usd?: number | null
  timing_ms?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  mira_version?: string | null
  report_prompt_version?: string | null
}

type ContentSource = {
  original_table?: string
  original_id?: string
  assessment_id?: string | null
  admin_notes?: string | null
}

// ═══════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════

export default async function AdminReportsPage() {
  const supabase = createServiceClient()

  // Pending review reports (content_type='report' filter)
  const { data: rawReports, error: reportsErr } = await supabase
    .from('content_items')
    .select('id, created_at, status, generated_by, generation_metadata, content_json, user_id')
    .eq('content_type', 'report')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  if (reportsErr) {
    console.error('[admin/reports] Reports fetch error:', reportsErr)
    return (
      <div className="rounded-lg border border-humanos-rose bg-humanos-rose/10 px-6 py-4 text-humanos-rose">
        <p className="font-medium">Raporlar yüklenirken hata oluştu.</p>
        <p className="text-sm mt-1 opacity-80">{reportsErr.message}</p>
      </div>
    )
  }

  const reports = (rawReports ?? []) as ContentItemRow[]

  // Empty state
  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="font-serif text-3xl text-humanos-text mb-3">
          Bekleyen rapor yok
        </h1>
        <p className="text-humanos-text-muted">
          Yeni bir Mira raporu üretildiğinde burada görünecek.
        </p>
      </div>
    )
  }

  // Profiles batched fetch (Day 12 pattern, hâlâ geçerli)
  const userIds = Array.from(new Set(reports.map((r) => r.user_id)))

  const { data: profilesData, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profilesErr) {
    console.error('[admin/reports] Profiles fetch error:', profilesErr)
  }

  const profiles = (profilesData ?? []) as ProfileRow[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-humanos-text mb-2">
          Bekleyen Raporlar
        </h1>
        <p className="text-humanos-text-muted">
          {reports.length} rapor onayını bekliyor
        </p>
      </div>

      {/* Reports table */}
      <div className="overflow-hidden rounded-2xl border border-humanos-border-faint bg-white/50 backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-humanos-border-faint bg-white/30">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-humanos-text-muted">
                Kullanıcı
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-humanos-text-muted">
                Tip
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-humanos-text-muted">
                Tarih
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-humanos-text-muted">
                Maliyet
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-humanos-text-muted">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const profile = profileMap.get(report.user_id)
              const userName = profile?.full_name ?? 'İsimsiz Kullanıcı'

              const meta = (report.generation_metadata ?? {}) as GenerationMetadata
              const contentJsonObj = (report.content_json ?? {}) as Record<string, unknown>
              const source = contentJsonObj._source as ContentSource | undefined

              const date = new Date(report.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              const cost = meta.cost_usd ? `$${meta.cost_usd.toFixed(3)}` : '—'
              const isMigrated = source?.original_table === 'ai_reports'

              return (
                <tr
                  key={report.id}
                  className="border-b border-humanos-border-faint last:border-0 hover:bg-humanos-accent/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-humanos-text">{userName}</div>
                    <div className="text-xs text-humanos-text-muted font-mono mt-0.5">
                      {report.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-humanos-text">Yaşam Analizi</div>
                    {isMigrated && (
                      <div className="text-xs text-humanos-amber mt-0.5">↻ Migrated</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-humanos-text-muted">{date}</td>
                  <td className="px-6 py-4 text-right text-sm font-mono text-humanos-text-muted">
                    {cost}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-humanos-accent hover:text-humanos-accent/80 transition-colors"
                    >
                      İncele →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-humanos-text-muted text-center">
        content_items polymorphic table · content_type=&apos;report&apos;
      </p>
    </div>
  )
}
