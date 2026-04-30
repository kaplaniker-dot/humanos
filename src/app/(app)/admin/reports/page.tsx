// src/app/(app)/admin/reports/page.tsx
// Day 12 — Admin: Pending Review Raporlar Listesi
// Day 12 fix — JOIN yerine manuel batched fetch (ai_reports.user_id FK eksik)
//
// Server Component. Auth zaten parent layout'ta requireAdmin() ile yapıldı.
// Service role client kullanıyoruz (RLS bypass) — admin yetkili kabul.

import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════
// TYPES (yerel — bu dosyaya özel)
// ═══════════════════════════════════════════════════

type ReportRow = {
  id: string
  created_at: string
  status: string
  cost_usd: number | null
  timing_ms: number | null
  mira_version: string | null
  user_id: string
  assessment_id: string
  assessment: {
    assessment_path: string | null
    selected_dimensions: string[] | null
    completed_at: string | null
  } | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

// ═══════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════

export default async function AdminReportsPage() {
  const supabase = createServiceClient()

  // ─── Step 1: Pending review raporları çek (assessment JOIN'li) ───
  const { data: rawReports, error: reportsErr } = await supabase
    .from('ai_reports')
    .select(
      `
      id,
      created_at,
      status,
      cost_usd,
      timing_ms,
      mira_version,
      user_id,
      assessment_id,
      assessment:life_assessments!ai_reports_assessment_id_fkey(
        assessment_path,
        selected_dimensions,
        completed_at
      )
    `,
    )
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

  const reports = (rawReports ?? []) as unknown as ReportRow[]

  // ─── Empty state ───
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

  // ─── Step 2: Tüm user_id'leri topla, profiles'ı tek sorguda çek ───
  const userIds = Array.from(new Set(reports.map((r) => r.user_id)))

  const { data: profilesData, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profilesErr) {
    console.error('[admin/reports] Profiles fetch error:', profilesErr)
    // Profile fetch hatası kritik değil — raporları yine de göster, isimsiz olur
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
                Analiz Tipi
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

              const assessmentData = Array.isArray(report.assessment)
                ? report.assessment[0]
                : report.assessment

              const path = assessmentData?.assessment_path ?? '—'
              const pathLabel =
                path === 'focused'
                  ? 'Odaklı'
                  : path === 'general'
                    ? 'Genel'
                    : path
              const dimensions = assessmentData?.selected_dimensions ?? []
              const dimCount = Array.isArray(dimensions) ? dimensions.length : 0

              const date = new Date(report.created_at).toLocaleDateString(
                'tr-TR',
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )

              const cost = report.cost_usd
                ? `$${report.cost_usd.toFixed(3)}`
                : '—'

              return (
                <tr
                  key={report.id}
                  className="border-b border-humanos-border-faint last:border-0 hover:bg-humanos-accent/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-humanos-text">
                      {userName}
                    </div>
                    <div className="text-xs text-humanos-text-muted font-mono mt-0.5">
                      {report.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-humanos-text">{pathLabel}</div>
                    <div className="text-xs text-humanos-text-muted">
                      {dimCount} boyut
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-humanos-text-muted">
                    {date}
                  </td>
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

      {/* Footer note */}
      <p className="mt-4 text-xs text-humanos-text-muted text-center">
        Mira sürümü: v2.0.0-2026-04-29 · Service: claude-sonnet-4-6
      </p>
    </div>
  )
}
