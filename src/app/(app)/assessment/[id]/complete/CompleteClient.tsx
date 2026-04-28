// src/app/(app)/assessment/[id]/complete/CompleteClient.tsx
// Client Component: tamamlama deneyimi — paper theme, breath orb, animasyon
// Day 10 D4 — "yolculuk başlıyor" hissi

'use client'

import Link from 'next/link'
import { BreathOrb } from '@/components/ui/BreathOrb'
import { Button } from '@/components/ui/Button'

type CompleteClientProps = {
  userName: string
  assessmentId: string
  dimensionCount: number
}

export function CompleteClient({
  userName,
  dimensionCount,
}: CompleteClientProps) {
  return (
    <div className="relative min-h-screen bg-humanos-bg overflow-hidden">
      {/* Ambient orbs — birden fazla, derin atmosfer */}
      <BreathOrb
        color="var(--color-humanos-amber)"
        position="top-right"
        size={600}
        opacity={0.22}
      />
      <BreathOrb
        color="var(--color-humanos-terracotta)"
        position="bottom-left"
        size={500}
        opacity={0.18}
      />

      {/* Content */}
      <div className="relative mx-auto max-w-[640px] px-6 pt-32 pb-20 text-center">
        {/* Kalp atışı — küçük noktasal işaret */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div
              className="w-3 h-3 rounded-full animate-pulse-soft"
              style={{ background: 'var(--color-humanos-terracotta)' }}
            />
            <div
              className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
              style={{
                background: 'var(--color-humanos-terracotta)',
                opacity: 0.4,
              }}
            />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-normal text-6xl leading-[1.05] tracking-tight text-humanos-text mb-6">
          Tebrikler,
          <br />
          <span className="italic" style={{ color: 'var(--color-humanos-terracotta)' }}>
            {userName}.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="font-sans text-lg text-humanos-text-muted leading-relaxed mb-2">
          Cevapların alındı.
        </p>
        <p className="font-serif italic text-xl text-humanos-text leading-relaxed mb-12">
          Şimdi senin için bir analiz hazırlanıyor.
        </p>

        {/* Stats / context */}
        <div className="flex items-center justify-center gap-2.5 mb-16">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-humanos-amber)' }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-humanos-text-muted">
            {dimensionCount} boyut · paylaşıldı · işleniyor
          </span>
        </div>

        {/* Timeline */}
        <div className="relative mb-16 px-4 py-8 rounded-3xl border border-humanos-border-faint bg-humanos-surface/50">
          <div className="flex flex-col gap-6 text-left">
            <TimelineRow
              status="done"
              title="Cevapların kaydedildi"
              detail="Tüm dimension verilerin güvenli şekilde saklandı."
            />
            <TimelineRow
              status="active"
              title="AI raporun hazırlanıyor"
              detail="Analizin yarın email kutuna gelecek."
            />
            <TimelineRow
              status="pending"
              title="Kişiselleştirilmiş plan"
              detail="Rapor tamamlandığında dashboard'da göreceksin."
            />
          </div>
        </div>

        {/* CTA — primary */}
        <div className="flex flex-col items-center gap-5">
          <Link href="/dashboard">
            <Button variant="primary" arrow="right">
              Dashboard'a dön
            </Button>
          </Link>

          <p className="font-sans text-sm italic text-humanos-text-subtle max-w-md leading-relaxed">
            AI rapor + birebir koçluk hakkında daha fazla bilgi yarın hazır olacak.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline row component ───
type TimelineRowProps = {
  status: 'done' | 'active' | 'pending'
  title: string
  detail: string
}

function TimelineRow({ status, title, detail }: TimelineRowProps) {
  const colors = {
    done: 'var(--color-dim-exercise)', // sage
    active: 'var(--color-humanos-terracotta)',
    pending: 'var(--color-humanos-border-strong)',
  }
  const color = colors[status]

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center pt-1">
        {status === 'done' ? (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: color }}
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : status === 'active' ? (
          <div className="relative">
            <div
              className="w-5 h-5 rounded-full animate-pulse-soft"
              style={{ background: color }}
            />
            <div
              className="absolute inset-0 w-5 h-5 rounded-full animate-ping"
              style={{ background: color, opacity: 0.3 }}
            />
          </div>
        ) : (
          <div
            className="w-5 h-5 rounded-full border-2"
            style={{ borderColor: color, background: 'transparent' }}
          />
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-sans text-base font-medium text-humanos-text mb-1">
          {title}
        </h3>
        <p className="font-sans text-sm italic text-humanos-text-muted leading-relaxed">
          {detail}
        </p>
      </div>
    </div>
  )
}
