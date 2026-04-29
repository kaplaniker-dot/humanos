// scripts/test-anthropic.ts
// Day 11 — Anthropic API health check
// Usage: npx tsx scripts/test-anthropic.ts

import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local dosyasını manuel yükle
config({ path: resolve(process.cwd(), '.env.local') })

// Sonra import et (env var'lar yüklendikten sonra)
import { pingAnthropic } from '../src/lib/mira/anthropic-client'

async function main() {
  console.log('🌱 Pinging Anthropic API...')
  console.log('   Model: claude-haiku-4-5-20251001')
  console.log('   Cost: ~$0.0001')
  console.log('')

  const start = Date.now()
  const result = await pingAnthropic()
  const elapsed = Date.now() - start

  if (result.success) {
    console.log(`✅ SUCCESS — API key works (${elapsed}ms)`)
    console.log('')
    console.log('humanOS is connected to Anthropic.')
    console.log('Mira can now speak.')
  } else {
    console.log(`❌ FAILED — ${result.error}`)
    console.log('')
    console.log('Possible causes:')
    console.log('  - API key invalid/expired')
    console.log('  - No credit balance')
    console.log('  - Network connection issue')
    console.log('  - Model name changed')
  }

  process.exit(result.success ? 0 : 1)
}

main().catch((err) => {
  console.error('💥 Crash:', err)
  process.exit(1)
})
