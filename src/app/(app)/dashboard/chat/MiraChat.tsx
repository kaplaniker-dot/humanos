// src/app/(app)/dashboard/chat/MiraChat.tsx
// Day 13.4 — Mira Chat Client Component
//
// Sorumluluklar:
// - Mesaj listesi render
// - Input + send
// - Optimistic UI (kullanıcı mesajı hemen görünür)
// - Typing indicator (Mira düşünürken)
// - Auto-scroll bottom
// - Quota header
// - Soft paywall (quota tükendiğinde)

'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'

// ============================================================
// TYPES
// ============================================================

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

type Quota = {
  tier: 'freemium' | 'premium'
  used: number
  limit: number
  remaining: number
  period: 'lifetime' | 'monthly'
  exhausted: boolean
}

type Props = {
  firstName: string | null
  initialHistory: Message[]
  initialQuota: Quota
  hasApprovedReport: boolean
}

// ============================================================
// COMPONENT
// ============================================================

export function MiraChat({
  firstName,
  initialHistory,
  initialQuota,
  hasApprovedReport,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialHistory)
  const [quota, setQuota] = useState<Quota>(initialQuota)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll bottom her yeni mesajda
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Sayfa yüklendiğinde input'a focus
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Eğer hiç mesaj yoksa, statik bir Mira karşılama mesajı göster
  const showWelcome = messages.length === 0

  // ─── SEND HANDLER ───
  async function handleSend(e?: FormEvent) {
    e?.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || sending || quota.exhausted) return

    setError(null)

    // Optimistic UI — kullanıcı mesajını hemen ekle
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Quota dolduysa özel handle
        if (res.status === 403 && data.error === 'quota_exhausted') {
          setQuota({ ...quota, remaining: 0, used: quota.limit, exhausted: true })
          setError(data.message)
          // Optimistic mesajı geri al — DB'ye yazılmadı
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
          return
        }
        throw new Error(data.error || data.detail || 'Bilinmeyen hata')
      }

      // Mira cevabını ekle
      const assistantMessage: Message = {
        id: `mira-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Quota güncelle
      if (data.quota) {
        setQuota({
          ...quota,
          used: data.quota.used,
          remaining: data.quota.remaining,
          exhausted: data.quota.remaining === 0,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bağlantı hatası'
      setError(message)
      // Optimistic mesajı geri al
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setSending(false)
    }
  }

  // Enter ile gönder, Shift+Enter ile yeni satır
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isExhausted = quota.remaining === 0
  const quotaLabel =
    quota.tier === 'premium'
      ? `Bu ay: ${quota.used} / ${quota.limit}`
      : `${quota.remaining} ücretsiz mesajın kaldı`

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-humanos-border flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-humanos-text">Mira</h1>
          <p className="text-sm text-humanos-text-muted italic">
            humanOS&apos;un yapay zeka tabanlı sesi
          </p>
        </div>
        <div className="text-sm text-humanos-text-muted">{quotaLabel}</div>
      </header>

      {/* MESAJ LİSTESİ */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {showWelcome && <WelcomeMessage firstName={firstName} hasApprovedReport={hasApprovedReport} />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {sending && <TypingIndicator />}

        <div ref={scrollRef} />
      </div>

      {/* PAYWALL CARD veya INPUT */}
      {isExhausted ? (
        <PaywallCard tier={quota.tier} />
      ) : (
        <form
          onSubmit={handleSend}
          className="border-t border-humanos-border px-6 py-4"
        >
          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mira'ya bir şey sor..."
              rows={2}
              maxLength={5000}
              disabled={sending}
              className="flex-1 resize-none bg-humanos-surface border border-humanos-border rounded-lg px-4 py-3 text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-humanos-accent hover:bg-humanos-accent-hover disabled:bg-humanos-border-strong disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-lg transition-colors"
            >
              {sending ? '...' : 'Gönder'}
            </button>
          </div>
          <p className="mt-2 text-xs text-humanos-text-subtle">
            Enter ile gönder, Shift+Enter ile yeni satır
          </p>
        </form>
      )}
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function WelcomeMessage({
  firstName,
  hasApprovedReport,
}: {
  firstName: string | null
  hasApprovedReport: boolean
}) {
  const greeting = firstName ? `Selamlar ${firstName}` : 'Selamlar'

  const body = hasApprovedReport
    ? `${greeting}. Geçen seferki analizine baktım — örüntün hakkında konuşacak çok şey var. Ama önce sen söyle: bugün hangi konu kafanı meşgul ediyor, oradan başlayalım.`
    : `${greeting}. Mira'yım — humanOS'un yapay zeka tabanlı sesi. Sağlık, enerji, alışkanlık, performans — bu alanlarda düşünmek, konuşmak, plan kurmak için buradayım. İlk soruna ne diyebilirim?`

  return (
    <div className="bg-humanos-accent-soft border-l-2 border-humanos-accent px-5 py-4 rounded">
      <p className="text-humanos-text leading-relaxed whitespace-pre-wrap">{body}</p>
      <p className="mt-3 text-sm text-humanos-text-muted">
        — Mira
        <br />
        <em className="text-xs">humanOS&apos;un yapay zeka tabanlı sesi</em>
      </p>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'bg-humanos-accent text-white rounded-br-sm'
            : 'bg-humanos-surface border border-humanos-border text-humanos-text rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-humanos-surface border border-humanos-border px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-humanos-text-subtle rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-humanos-text-subtle rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-humanos-text-subtle rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}

function PaywallCard({ tier }: { tier: 'freemium' | 'premium' }) {
  return (
    <div className="border-t border-humanos-border px-6 py-6 bg-humanos-accent-soft">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="font-serif text-xl text-humanos-text mb-2">
          {tier === 'freemium'
            ? 'Ücretsiz mesaj hakkın doldu'
            : 'Bu ay\'ki mesaj hakkın doldu'}
        </h3>
        <p className="text-humanos-text-muted mb-4 leading-relaxed">
          {tier === 'freemium'
            ? 'Mira ile sınırsız konuşmak, kişiselleştirilmiş yaşam analizi ve premium içeriklere erişmek için Premium\'a geç.'
            : 'Yeni ay başında mesaj hakkın sıfırlanacak. Beklemek istemiyorsan ek paket alabilirsin.'}
        </p>
        <button
          type="button"
          onClick={() => alert('Stripe entegrasyonu Day 14+\'a planlandı')}
          className="bg-humanos-accent hover:bg-humanos-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {tier === 'freemium' ? 'Premium\'a Geç' : 'Detayları Gör'}
        </button>
      </div>
    </div>
  )
}
