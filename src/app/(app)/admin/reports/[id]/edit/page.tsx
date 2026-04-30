// src/app/(app)/admin/reports/[id]/edit/page.tsx
// Day 12 — Admin: Rapor Edit Sayfası (Server Shell)
// Day 12 A5.6.2 — Server Component shell, EditForm yarın gelecek (A5.6.3)
//
// Dynamic route: /admin/reports/{report_id}/edit
// Sadece pending_review veya rejected raporlar düzenlenebilir.

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { EditForm } from './EditForm'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════

export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ─── Auth ───
  await requireAdmin()

  const { id } = await params
  const supabase = createServiceClient()

  // ─── Raporu çek ───
  const { data: report, error } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !report) {
    notFound()
  }

  // ─── Status kontrolü ───
  // Sadece pending_review veya rejected düzenlenebilir
  if (report.status !== 'pending_review' && report.status !== 'rejected') {
    // Approved raporlar düzenlenemez — detay sayfasına geri gönder
    redirect(`/admin/reports/${id}`)
  }

  // ─── Profile bilgisi (kullanıcı adı header'da göstermek için) ───
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', report.user_id)
    .single()

  const userName = profile?.full_name ?? 'İsimsiz Kullanıcı'

  // ─── Status badge için ───
  const statusLabel =
    report.status === 'pending_review' ? 'Onay Bekliyor' : 'Reddedildi'
  const statusCls =
    report.status === 'pending_review'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-humanos-rose/15 text-humanos-rose'

  return (
    <div className="max-w-[860px] mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm flex items-center gap-2">
        <Link
          href="/admin/reports"
          className="text-humanos-text-muted hover:text-humanos-accent transition-colors"
        >
          Tüm raporlar
        </Link>
        <span className="text-humanos-text-subtle">/</span>
        <Link
          href={`/admin/reports/${id}`}
          className="text-humanos-text-muted hover:text-humanos-accent transition-colors"
        >
          {userName}
        </Link>
        <span className="text-humanos-text-subtle">/</span>
        <span className="text-humanos-text">Düzenle</span>
      </nav>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-humanos-border-faint bg-white/50 backdrop-blur-sm p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif text-3xl text-humanos-text mb-1">
              Raporu Düzenle
            </h1>
            <p className="text-sm text-humanos-text-muted">
              {userName} · <span className="font-mono">{report.id.slice(0, 8)}</span>
            </p>
          </div>
          <span
            className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${statusCls}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-humanos-text-muted mt-3 pt-3 border-t border-humanos-border-faint">
          Mira&apos;nın ürettiği rapor üzerinde değişiklik yapabilirsin. Kaydet — taslak olarak kaydeder, status değişmez. Kaydet ve Onayla — değişikliği uygular ve raporu kullanıcıya açar.
        </p>
      </div>

      {/* Edit Form (Client Component) */}
      <EditForm
        reportId={report.id}
        initialContent={report.content_json}
        currentStatus={report.status}
      />
    </div>
  )
}
