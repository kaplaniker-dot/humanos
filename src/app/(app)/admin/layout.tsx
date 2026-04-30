// src/app/(app)/admin/layout.tsx
// Day 12 — Admin paneli ortak layout + auth gate
//
// Bu layout altındaki TÜM route'lar (/admin, /admin/reports, /admin/reports/[id])
// otomatik olarak requireAdmin() filtresinden geçer.

import { requireAdmin } from '@/lib/auth/require-admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ─── Auth gate ───
  // Yetkisizse requireAdmin() içeriden redirect tetikler, buraya geri dönmez.
  const adminUser = await requireAdmin()

  return (
    <div className="min-h-screen bg-humanos-bg">
      {/* Admin nav bar */}
      <header className="border-b border-humanos-border-faint bg-white/40 backdrop-blur-sm">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/reports"
              className="font-serif text-xl text-humanos-text hover:text-humanos-accent transition-colors"
            >
              humanOS Admin
            </Link>
            <span className="text-xs uppercase tracking-wider text-humanos-text-muted px-2 py-0.5 rounded bg-humanos-accent/10 text-humanos-accent">
              {adminUser.role}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/reports"
              className="text-humanos-text-muted hover:text-humanos-text transition-colors"
            >
              Raporlar
            </Link>
            <Link
              href="/dashboard"
              className="text-humanos-text-muted hover:text-humanos-text transition-colors"
            >
              ← Dashboard'a dön
            </Link>
            <span className="text-humanos-text-muted">
              {adminUser.fullName ?? adminUser.user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Sayfa içeriği */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {children}
      </main>
    </div>
  )
}
