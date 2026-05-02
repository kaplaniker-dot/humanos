// src/app/(app)/admin/reports/[id]/page.tsx
// Day 14.3.b — Admin: Rapor Detay Sayfası (content_items refactor)
//
// Day 12'den miras: Mira'nın 7 section'lı render mantığı, status badge,
// ActionButtons entegrasyonu — birebir korundu.
//
// Day 14 değişiklikleri:
//   - Query kaynağı: ai_reports → content_items + content_type='report' filter
//   - Metadata: direct kolonlar yerine generation_metadata JSONB içinden
//   - Defensive guard: content_type !== 'report' ise notFound()
//
// Mira content_json schema (Day 11 V2) — birebir aynı, dokunulmadı.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { ActionButtons } from './ActionButtons'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════
// TYPES — Mira content_json schema (Day 11 V2)
// ═══════════════════════════════════════════════════

type WeeklyPlanItem = {
  day: string
  action: string
  duration_min: number
}

type MiraReportContent = {
  version?: string
  user_name?: string
  report_date?: string
  sections?: {
    opening?: string
    current_state?: {
      strengths?: string[]
      watch_areas?: string[]
    }
    pattern?: string
    priority_map?: {
      main_goal?: string
      main_action?: string
      support_1?: string
      support_2?: string
    }
    weekly_plan?: WeeklyPlanItem[]
    closing?: string
    medical_disclaimer?: string
  }
  metadata?: {
    total_word_count?: number
    primary_hypothesis?: string
    uncertainty_flags?: string[]
    follow_up_questions?: string[]
  }
  // Day 14.2 migration tracking
  _source?: {
    original_table?: string
    original_id?: string
    assessment_id?: string | null
    admin_notes?: string | null
  }
}

type GenerationMetadata = {
  cost_usd?: number | null
  timing_ms?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  mira_version?: string | null
  report_prompt_version?: string | null
}

// ═══════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: report, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !report) {
    notFound()
  }

  // Defensive guard — bu sayfa sadece 'report' tipini render eder
  if (report.content_type !== 'report') {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', report.user_id)
    .single()

  const userName = profile?.full_name ?? 'İsimsiz Kullanıcı'

  const content = (report.content_json ?? {}) as MiraReportContent
  const sections = content.sections ?? {}
  const metadata = content.metadata ?? {}

  const meta = (report.generation_metadata ?? {}) as GenerationMetadata

  const createdDate = new Date(report.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const cost = meta.cost_usd ? `$${meta.cost_usd.toFixed(4)}` : '—'
  const timing = meta.timing_ms ? `${(meta.timing_ms / 1000).toFixed(1)}s` : '—'
  const tokens =
    meta.input_tokens && meta.output_tokens
      ? `${meta.input_tokens.toLocaleString('tr-TR')} + ${meta.output_tokens.toLocaleString('tr-TR')}`
      : '—'

  const statusBadge =
    report.status === 'pending_review'
      ? { label: 'Onay Bekliyor', cls: 'bg-amber-100 text-amber-800' }
      : report.status === 'approved'
        ? { label: 'Onaylandı', cls: 'bg-green-100 text-green-800' }
        : report.status === 'rejected'
          ? { label: 'Reddedildi', cls: 'bg-humanos-rose/15 text-humanos-rose' }
          : { label: report.status, cls: 'bg-gray-100 text-gray-800' }

  // Action buttons hangi state'lerde gösterilecek
  const showActions =
    report.status === 'pending_review' || report.status === 'rejected'

  // Migration tracking gösterimi (Day 14.2'den taşınan raporlar için)
  const isMigrated = content._source?.original_table === 'ai_reports'

  return (
    <div className="max-w-[860px] mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link
          href="/admin/reports"
          className="text-humanos-text-muted hover:text-humanos-accent transition-colors"
        >
          ← Tüm raporlar
        </Link>
      </nav>

      {/* Metadata Bar */}
      <div className="mb-8 rounded-2xl border border-humanos-border-faint bg-white/50 backdrop-blur-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-serif text-3xl text-humanos-text mb-1">
              {userName}
            </h1>
            <p className="text-sm text-humanos-text-muted font-mono">
              {report.id}
            </p>
            {isMigrated && (
              <p className="text-xs text-humanos-amber mt-1">
                ↻ ai_reports&apos;tan migrate edildi (orijinal: {content._source?.original_id?.slice(0, 8)})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-humanos-border-faint">
          <div>
            <div className="text-xs text-humanos-text-muted uppercase tracking-wider mb-1">
              Tarih
            </div>
            <div className="text-sm text-humanos-text">{createdDate}</div>
          </div>
          <div>
            <div className="text-xs text-humanos-text-muted uppercase tracking-wider mb-1">
              Maliyet
            </div>
            <div className="text-sm text-humanos-text font-mono">{cost}</div>
          </div>
          <div>
            <div className="text-xs text-humanos-text-muted uppercase tracking-wider mb-1">
              Süre
            </div>
            <div className="text-sm text-humanos-text font-mono">{timing}</div>
          </div>
          <div>
            <div className="text-xs text-humanos-text-muted uppercase tracking-wider mb-1">
              Tokenler
            </div>
            <div className="text-sm text-humanos-text font-mono">{tokens}</div>
          </div>
        </div>
      </div>

      {/* Report Body */}
      <article className="rounded-2xl border border-humanos-border-faint bg-white/70 backdrop-blur-sm p-10">
        {sections.opening && (
          <div className="mb-10 pb-10 border-b border-humanos-border-faint">
            <p className="font-serif text-xl text-humanos-text leading-relaxed italic">
              {sections.opening}
            </p>
          </div>
        )}

        {sections.current_state && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-humanos-text mb-6">
              Mevcut Durum
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {sections.current_state.strengths &&
                sections.current_state.strengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider text-humanos-text-muted mb-3">
                      Güçlü Yanlar
                    </h3>
                    <ul className="space-y-2">
                      {sections.current_state.strengths.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-humanos-text leading-relaxed"
                        >
                          <span className="text-humanos-accent mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {sections.current_state.watch_areas &&
                sections.current_state.watch_areas.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium uppercase tracking-wider text-humanos-text-muted mb-3">
                      İzlenmesi Gerekenler
                    </h3>
                    <ul className="space-y-2">
                      {sections.current_state.watch_areas.map((item, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-humanos-text leading-relaxed"
                        >
                          <span className="text-amber-600 mt-0.5">○</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </section>
        )}

        {sections.pattern && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-humanos-text mb-4">
              Örüntü
            </h2>
            <div className="rounded-xl bg-humanos-accent/5 border border-humanos-accent/20 p-6">
              <p className="text-humanos-text leading-relaxed">
                {sections.pattern}
              </p>
            </div>
          </section>
        )}

        {sections.priority_map && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-humanos-text mb-4">
              Öncelik Haritası
            </h2>
            <div className="space-y-4">
              {sections.priority_map.main_goal && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                    Ana Hedef
                  </div>
                  <p className="text-humanos-text font-medium">
                    {sections.priority_map.main_goal}
                  </p>
                </div>
              )}
              {sections.priority_map.main_action && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                    Asıl Aksiyon
                  </div>
                  <p className="text-humanos-text">
                    {sections.priority_map.main_action}
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {sections.priority_map.support_1 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                      Destek 1
                    </div>
                    <p className="text-humanos-text text-sm">
                      {sections.priority_map.support_1}
                    </p>
                  </div>
                )}
                {sections.priority_map.support_2 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                      Destek 2
                    </div>
                    <p className="text-humanos-text text-sm">
                      {sections.priority_map.support_2}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {sections.weekly_plan && sections.weekly_plan.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-humanos-text mb-4">
              Haftalık Plan
            </h2>
            <div className="space-y-3">
              {sections.weekly_plan.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start p-4 rounded-lg bg-humanos-bg/50 border border-humanos-border-faint"
                >
                  <div className="font-medium text-humanos-accent text-sm w-20 flex-shrink-0">
                    {item.day}
                  </div>
                  <div className="flex-1">
                    <p className="text-humanos-text">{item.action}</p>
                  </div>
                  <div className="text-xs text-humanos-text-muted font-mono whitespace-nowrap">
                    {item.duration_min} dk
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sections.closing && (
          <section className="mb-10 pt-10 border-t border-humanos-border-faint">
            <p className="font-serif text-lg text-humanos-text leading-relaxed">
              {sections.closing}
            </p>
            <div className="mt-6 text-sm">
              <div className="text-humanos-text">— Mira</div>
              <div className="italic text-humanos-text-muted">
                humanOS&apos;un yapay zeka tabanlı sesi
              </div>
            </div>
          </section>
        )}

        {sections.medical_disclaimer && (
          <div className="mt-10 pt-6 border-t border-humanos-border-faint">
            <p className="text-xs text-humanos-text-muted leading-relaxed italic">
              {sections.medical_disclaimer}
            </p>
          </div>
        )}
      </article>

      {/* Mira Metadata (collapsible — admin için faydalı) */}
      {(metadata.primary_hypothesis ||
        (metadata.uncertainty_flags && metadata.uncertainty_flags.length > 0) ||
        (metadata.follow_up_questions && metadata.follow_up_questions.length > 0)) && (
        <details className="mt-6 rounded-2xl border border-humanos-border-faint bg-white/30 backdrop-blur-sm">
          <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-humanos-text hover:text-humanos-accent transition-colors">
            Mira&apos;nın iç notları (admin görünümü)
          </summary>
          <div className="px-6 pb-6 space-y-4 text-sm">
            {metadata.primary_hypothesis && (
              <div>
                <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                  Ana Hipotez
                </div>
                <p className="text-humanos-text">
                  {metadata.primary_hypothesis}
                </p>
              </div>
            )}
            {metadata.uncertainty_flags &&
              metadata.uncertainty_flags.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                    Belirsizlik Bayrakları
                  </div>
                  <ul className="list-disc list-inside text-humanos-text space-y-1">
                    {metadata.uncertainty_flags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            {metadata.follow_up_questions &&
              metadata.follow_up_questions.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-humanos-text-muted mb-1">
                    Takip Soruları
                  </div>
                  <ul className="list-disc list-inside text-humanos-text space-y-1">
                    {metadata.follow_up_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            {metadata.total_word_count && (
              <div className="text-xs text-humanos-text-muted">
                Toplam kelime: {metadata.total_word_count}
              </div>
            )}
          </div>
        </details>
      )}

      {/* Reddedilmişse sebep göster */}
      {report.status === 'rejected' && report.rejected_reason && (
        <div className="mt-8 rounded-2xl border border-humanos-rose/30 bg-humanos-rose/5 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-humanos-rose mb-2">
            Red Sebebi
          </h3>
          <p className="text-humanos-text">{report.rejected_reason}</p>
        </div>
      )}

      {/* Action Buttons — pending_review veya rejected ise göster */}
      {showActions && (
        <div className="mt-8">
          <ActionButtons reportId={report.id} status={report.status} />
        </div>
      )}
    </div>
  )
}
