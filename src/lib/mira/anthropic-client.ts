// src/lib/mira/anthropic-client.ts
// Anthropic API client wrapper
// Day 11 — humanOS'un AI motoru için tek giriş noktası

import Anthropic from '@anthropic-ai/sdk'

// ═══════════════════════════════════════════════════
// CLIENT INSTANCE
// ═══════════════════════════════════════════════════

/**
 * Singleton Anthropic client.
 * Module-level: Next.js Server Component/Route'lar
 * arasında paylaşılır.
 */
let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_client) return _client

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is not set. ' +
        'Add it to .env.local or production environment.',
    )
  }

  _client = new Anthropic({
    apiKey,
  })

  return _client
}

// ═══════════════════════════════════════════════════
// MODEL CONFIG
// ═══════════════════════════════════════════════════

export const MIRA_MODELS = {
  // Premium AI rapor üretimi için (Day 11 V1)
  PREMIUM_REPORT: 'claude-sonnet-4-6',
  // Premium chat (continuous conversation)
  PREMIUM_CHAT: 'claude-sonnet-4-6',
  // Freemium 3-soru chatbot
  FREEMIUM_CHAT: 'claude-haiku-4-5-20251001',
} as const

export const MIRA_DEFAULTS = {
  // Premium rapor için — düşük temperature = tutarlı çıktı
  REPORT_TEMPERATURE: 0.4,
  // Chat için — biraz daha doğal
  CHAT_TEMPERATURE: 0.6,
  // Maksimum token (rapor için yeterli)
  REPORT_MAX_TOKENS: 4096,
  // Chat için
  CHAT_MAX_TOKENS: 2048,
} as const

// ═══════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════

/**
 * API key'in geçerli olduğunu doğrulamak için
 * minimum bir API çağrısı yapar.
 *
 * Sadece development/setup zamanında kullan.
 */
export async function pingAnthropic(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: MIRA_MODELS.FREEMIUM_CHAT,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok".' }],
    })

    const content = response.content[0]
    if (content.type === 'text' && content.text.toLowerCase().includes('ok')) {
      return { success: true }
    }

    return { success: false, error: 'Unexpected response' }
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message }
    }
    return { success: false, error: 'Unknown error' }
  }
}
