// src/app/api/chat/route.ts
// Mira Chat API — Day 13.3
// POST /api/chat
//
// Akış:
// 1. Auth check (user session)
// 2. Quota check (tier-aware)
// 3. Conversation history fetch
// 4. (Opsiyonel) Onaylı rapor bağlamı fetch
// 5. Mira'yı çağır (character + chat prompt birleşik)
// 6. Kullanıcı mesajını + Mira cevabını DB'ye yaz (Service Role)
// 7. Response döndür
//
// Day 13 fix (session_id null bug):
// - session_id artık uygulama tarafında üretilir (crypto.randomUUID).
// - DB DEFAULT'a güvenmek yerine explicit kontrol — Day 12 dersi.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MIRA_CHARACTER_PROMPT, MIRA_VERSION } from '@/lib/mira/character'
import { MIRA_CHAT_PROMPT, MIRA_CHAT_VERSION } from '@/lib/mira/chat-prompt'
import { getUserQuotaStatus } from '@/lib/mira/quota'

// ============================================================
// CONFIG
// ============================================================

const MODEL = 'claude-sonnet-4-5-20250929' // Sonnet 4.5 (Day 11 default chat model)
const MAX_TOKENS = 1024 // Chat cevapları kısa, 1024 yeterli (300 kelime ≈ 450 token)
const HISTORY_LIMIT = 20 // Son 20 mesaj context'e dahil edilir (10 turn)

// Sonnet 4.5 fiyatlandırma (per million tokens)
const COST_INPUT_PER_M = 3.0
const COST_OUTPUT_PER_M = 15.0

// ============================================================
// REQUEST SCHEMA
// ============================================================

type ChatRequest = {
  message: string
}

// ============================================================
// POST HANDLER
// ============================================================

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // ─── 1. PARSE REQUEST ───
    const body = (await request.json()) as ChatRequest

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'message field zorunlu ve string olmalı' },
        { status: 400 },
      )
    }

    const userMessage = body.message.trim()

    if (userMessage.length === 0) {
      return NextResponse.json(
        { error: 'Boş mesaj gönderilemez' },
        { status: 400 },
      )
    }

    if (userMessage.length > 5000) {
      return NextResponse.json(
        { error: 'Mesaj çok uzun (maks 5000 karakter)' },
        { status: 400 },
      )
    }

    // ─── 2. AUTH CHECK ───
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekiyor' },
        { status: 401 },
      )
    }

    // ─── 3. QUOTA CHECK ───
    // Service client ile sorgula — RLS bypass, kesin sonuç
    const serviceClient = createServiceClient()
    const quota = await getUserQuotaStatus(serviceClient, user.id)

    if (quota.exhausted) {
      return NextResponse.json(
        {
          error: 'quota_exhausted',
          message:
            quota.tier === 'freemium'
              ? 'Ücretsiz mesaj hakkın doldu. Mira ile sınırsız konuşmak için Premium\'a geç.'
              : 'Bu ay\'ki mesaj hakkın doldu. Yeni ay başında sıfırlanacak.',
          quota: {
            tier: quota.tier,
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
          },
        },
        { status: 403 },
      )
    }

    // ─── 4. CONVERSATION HISTORY FETCH ───
    // Son 20 mesaj — kronolojik sıra (eski → yeni)
    // session_id'yi de aynı sorguda alıyoruz (ek query'ye gerek yok)
    const { data: historyRows, error: historyError } = await serviceClient
      .from('mira_chat_messages')
      .select('role, content, session_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)

    if (historyError) {
      console.error('History fetch error:', historyError)
      return NextResponse.json(
        { error: 'Geçmiş yüklenemedi', detail: historyError.message },
        { status: 500 },
      )
    }

    // historyRows en yeni → eski sırada geliyor.
    // Anthropic eski → yeni ister, ek olarak son mesajdan session_id çekmek için
    // ters çevirmeden önce session_id'yi alıyoruz.
    const lastSessionId = historyRows?.[0]?.session_id ?? null
    const history = (historyRows ?? []).reverse()

    // ─── 5. ONAYLI RAPOR BAĞLAMI (varsa) ───
    let reportContext = ''
    const { data: latestReport } = await serviceClient
      .from('ai_reports')
      .select('content_json, created_at')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestReport && latestReport.content_json) {
      reportContext = `\n\n# KULLANICININ ONAYLI MIRA RAPORU\n\nKullanıcı daha önce yaşam analizi tamamladı, Mira raporu üretildi ve İlker tarafından onaylandı. Rapor içeriği aşağıda. Bu rapora **organik referans** verebilirsin, ama **tekrar etme** — kullanıcı raporu zaten okudu.\n\n${JSON.stringify(latestReport.content_json, null, 2)}`
    }

    // ─── 6. SYSTEM PROMPT BİRLEŞTİR ───
    const systemPrompt = `${MIRA_CHARACTER_PROMPT}\n\n---\n\n${MIRA_CHAT_PROMPT}${reportContext}`

    // ─── 7. ANTHROPIC ÇAĞRISI ───
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const messages = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    })

    // ─── 8. CEVABI ÇIKART ───
    const assistantContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim()

    if (!assistantContent) {
      return NextResponse.json(
        { error: 'Mira boş cevap döndürdü' },
        { status: 502 },
      )
    }

    // ─── 9. MALIYET HESAPLA ───
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const costUsd =
      (inputTokens * COST_INPUT_PER_M) / 1_000_000 +
      (outputTokens * COST_OUTPUT_PER_M) / 1_000_000

    const elapsedMs = Date.now() - startTime

    // ─── 10. SESSION ID — UYGULAMA TARAFINDA ÜRET ───
    // Geçmiş mesaj varsa son session_id'yi devam ettir; yoksa yeni UUID.
    // crypto.randomUUID() Node 14.17+ ve Next.js Edge runtime'da yerleşik,
    // import gerektirmez, RFC 4122 v4 standardına uyumlu.
    const sessionId: string = lastSessionId ?? crypto.randomUUID()

    // ─── 11. DB'YE YAZ (atomic — iki insert) ───
    // Önce kullanıcı mesajı, sonra Mira cevabı — kronoloji bozulmasın
    const nowIso = new Date().toISOString()
    const oneMsLaterIso = new Date(Date.now() + 1).toISOString() // sıralama garantisi

    const { error: insertError } = await serviceClient
      .from('mira_chat_messages')
      .insert([
        {
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: userMessage,
          created_at: nowIso,
        },
        {
          user_id: user.id,
          session_id: sessionId,
          role: 'assistant',
          content: assistantContent,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: costUsd,
          mira_character_version: MIRA_VERSION,
          mira_chat_prompt_version: MIRA_CHAT_VERSION,
          model_used: MODEL,
          metadata: { elapsed_ms: elapsedMs },
          created_at: oneMsLaterIso,
        },
      ])

    if (insertError) {
      console.error('DB insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Mesaj kaydedilemedi',
          detail: insertError.message,
        },
        { status: 500 },
      )
    }

    // ─── 12. RESPONSE ───
    // Quota'yı güncellenmiş haliyle dön (UI'da rakam göstermek için)
    const updatedQuota = await getUserQuotaStatus(serviceClient, user.id)

    return NextResponse.json({
      success: true,
      message: assistantContent,
      stats: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        elapsed_ms: elapsedMs,
      },
      quota: {
        tier: updatedQuota.tier,
        used: updatedQuota.used,
        limit: updatedQuota.limit,
        remaining: updatedQuota.remaining,
      },
    })
  } catch (err) {
    console.error('Chat API unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: 'Sunucu hatası', detail: message },
      { status: 500 },
    )
  }
}
