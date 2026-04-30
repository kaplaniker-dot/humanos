// src/app/(app)/admin/reports/[id]/ActionButtons.tsx
// Day 12 — Admin: Rapor aksiyon butonları (Client Component)
// Day 12 A5.5 — approve, reject
// Day 12 patch — reset (rejected → pending) eklendi
// Day 12 A5.6.5 — "Düzenle" butonu eklendi (her iki durumda da)

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  approveReport,
  rejectReport,
  resetReportToPending,
} from './actions'

type Props = {
  reportId: string
  status: string
}

export function ActionButtons({ reportId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleApprove() {
    setErrorMsg(null)
    if (!confirm('Bu raporu onaylamak istediğinden emin misin?')) return

    startTransition(async () => {
      const result = await approveReport(reportId)
      if (!result.success) {
        setErrorMsg(result.error)
      }
    })
  }

  function handleReject() {
    setErrorMsg(null)
    const trimmed = rejectReason.trim()

    if (trimmed.length < 5) {
      setErrorMsg('Red sebebi en az 5 karakter olmalı')
      return
    }

    startTransition(async () => {
      const result = await rejectReport(reportId, trimmed)
      if (!result.success) {
        setErrorMsg(result.error)
      }
    })
  }

  function handleReset() {
    setErrorMsg(null)
    if (
      !confirm(
        'Bu raporu tekrar onay bekleyenlere alalım mı? Mevcut red sebebi silinecek.',
      )
    )
      return

    startTransition(async () => {
      const result = await resetReportToPending(reportId)
      if (!result.success) {
        setErrorMsg(result.error)
        return
      }
      router.refresh()
    })
  }

  // ─── REJECTED state — Düzenle + Yeniden Değerlendir ───
  if (status === 'rejected') {
    return (
      <div className="rounded-2xl border border-humanos-border-faint bg-white/50 backdrop-blur-sm p-6">
        {errorMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-humanos-rose bg-humanos-rose/10 text-humanos-rose text-sm">
            {errorMsg}
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-humanos-text-muted">
            Bu raporu düzenleyerek veya tekrar değerlendirerek geri alabilirsin.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/admin/reports/${reportId}/edit`}
              className="px-5 py-2 rounded-lg border border-humanos-accent text-humanos-accent text-sm font-medium hover:bg-humanos-accent-soft transition-colors"
            >
              ✎ Düzenle
            </Link>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="px-5 py-2 rounded-lg border border-humanos-border-faint text-humanos-text text-sm font-medium hover:bg-humanos-bg/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'İşleniyor…' : '↻ Yeniden Değerlendir'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PENDING_REVIEW state — Düzenle + Reddet + Onayla ───
  return (
    <div className="rounded-2xl border border-humanos-border-faint bg-white/50 backdrop-blur-sm p-6">
      {errorMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-humanos-rose bg-humanos-rose/10 text-humanos-rose text-sm">
          {errorMsg}
        </div>
      )}

      {showRejectForm && (
        <div className="mb-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-humanos-text mb-2 block">
              Red sebebi
            </span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Neden reddediliyor? (örn: Mira'nın tonu çok agresif, ana hipotez yanlış…)"
              className="w-full px-4 py-3 rounded-xl border border-humanos-border-faint bg-white text-humanos-text placeholder:text-humanos-text-muted focus:outline-none focus:border-humanos-accent transition-colors resize-none"
            />
          </label>
          <p className="text-xs text-humanos-text-muted">
            Bu sebep DB&apos;ye kaydedilir, gelecekte prompt iyileştirme için kullanılır.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-humanos-text-muted">
          {showRejectForm
            ? 'Red sebebi yaz, sonra Reddet butonuna bas'
            : 'Düzenle, Reddet veya Onayla'}
        </p>

        <div className="flex gap-3">
          {showRejectForm ? (
            <>
              <button
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                  setErrorMsg(null)
                }}
                disabled={isPending}
                className="px-5 py-2 rounded-lg border border-humanos-border-faint text-humanos-text text-sm font-medium hover:bg-humanos-bg/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                disabled={isPending || rejectReason.trim().length < 5}
                className="px-5 py-2 rounded-lg bg-humanos-rose text-white text-sm font-medium hover:bg-humanos-rose/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Reddediliyor…' : 'Reddet'}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/admin/reports/${reportId}/edit`}
                className="px-5 py-2 rounded-lg border border-humanos-accent text-humanos-accent text-sm font-medium hover:bg-humanos-accent-soft transition-colors"
              >
                ✎ Düzenle
              </Link>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="px-5 py-2 rounded-lg border border-humanos-border-faint text-humanos-text text-sm font-medium hover:bg-humanos-bg/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reddet…
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-5 py-2 rounded-lg bg-humanos-accent text-white text-sm font-medium hover:bg-humanos-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Onaylanıyor…' : 'Onayla'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
