// src/lib/mira/quota.ts
// Mira chat tier + quota helpers
// Day 13 — basit başlangıç, Day 14+ subscription katmanı eklenince genişler

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// TIER LIMITS
// ============================================================
// Premium: aylık 200 mesaj (her ay başı reset)
// Freemium: hayat boyu 3 mesaj (reset yok)
// ============================================================

export const TIER_LIMITS = {
  freemium: {
    max_messages: 3,
    period: 'lifetime' as const,
  },
  premium: {
    max_messages: 200,
    period: 'monthly' as const,
  },
} as const

export type ChatTier = keyof typeof TIER_LIMITS

// ============================================================
// getUserTier
// ============================================================
// Day 13 sürümü: tüm kullanıcılar freemium.
// Day 14+: profiles tablosuna subscription_tier kolonu eklenecek,
// bu fonksiyon onu okuyacak. Çağıran kod değişmeyecek.
// ============================================================

export async function getUserTier(
  _supabase: SupabaseClient,
  _userId: string,
): Promise<ChatTier> {
  // TODO Day 14+: profiles.subscription_tier kolonundan oku
  return 'freemium'
}

// ============================================================
// getUserQuotaStatus
// ============================================================
// Kullanıcının mevcut quota durumunu döner:
// - tier: hangi katmanda
// - used: kaç mesaj kullanmış (sadece role='user' sayılır)
// - limit: tier'ın limiti
// - remaining: kalan mesaj sayısı
// - exhausted: limit doldu mu
// ============================================================

export type QuotaStatus = {
  tier: ChatTier
  used: number
  limit: number
  remaining: number
  exhausted: boolean
  period: 'lifetime' | 'monthly'
}

export async function getUserQuotaStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuotaStatus> {
  const tier = await getUserTier(supabase, userId)
  const limits = TIER_LIMITS[tier]

  // Quota count query — sadece kullanıcı mesajları sayılır (Mira cevapları hariç)
  let query = supabase
    .from('mira_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')

  // Premium ise ay başına filtre ekle
  if (limits.period === 'monthly') {
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)
    query = query.gte('created_at', monthStart.toISOString())
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Quota query failed: ${error.message}`)
  }

  const used = count ?? 0
  const remaining = Math.max(0, limits.max_messages - used)

  return {
    tier,
    used,
    limit: limits.max_messages,
    remaining,
    exhausted: remaining === 0,
    period: limits.period,
  }
}
