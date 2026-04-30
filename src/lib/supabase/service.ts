// src/lib/supabase/service.ts
// Supabase Service Role Client
// Day 12 — RLS bypass için backend-only client
//
// ⚠️ KRİTİK GÜVENLİK NOTU
// Bu client RLS'i tamamen bypass eder. Sadece sunucu tarafında kullan
// (Route Handler, Server Action, server-only kod). Asla client'a ifşa etme.
//
// Kullanım deseni:
// 1. Önce createClient() ile auth doğrula (kullanıcı session'ı)
// 2. Manuel ownership check yap (user.id == payload.user_id)
// 3. Sonra service client ile DB write yap
//
// Örnek (Route Handler):
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) return 401
//   // ...ownership check...
//   const supabaseAdmin = createServiceClient()
//   await supabaseAdmin.from('table').insert({ user_id: user.id, ... })

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
