// src/lib/mira/types.ts
// Mira shared TypeScript types
//
// Day 14 borç temizliği: Quota ve Message tipleri Server + Client + API
// üçlüsü tarafından paylaşılır. Tek source of truth → drift yok.
//
// Day 13'te Bug 3'ün dersi: tip iki dosyada tanımlanırsa biri eklenince
// diğeri unutulur. Tek import noktası bu sorunu kökten çözer.

// ============================================================
// CHAT MESSAGE
// ============================================================

/**
 * Tek bir chat mesajı — Anthropic conversation format ile uyumlu.
 * DB'de mira_chat_messages tablosundan çekilir, UI'da render edilir.
 */
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// ============================================================
// QUOTA STATUS
// ============================================================

/**
 * Kullanıcının Mira chat quota durumu.
 * Server'da getUserQuotaStatus() üretir, Client'a prop olarak geçer,
 * UI'da quota label + paywall logic için kullanılır.
 */
export type ChatQuota = {
  tier: 'freemium' | 'premium'
  used: number
  limit: number
  remaining: number
  period: 'lifetime' | 'monthly'
  exhausted: boolean
}
