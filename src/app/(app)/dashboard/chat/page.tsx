// src/app/(app)/dashboard/chat/page.tsx
// Day 13.4 — Mira Chat sayfası (Server Component)
//
// Görev:
// - Auth check (login zorunlu)
// - Geçmiş mesajları fetch et
// - Quota durumunu fetch et
// - Onaylı rapor var mı kontrol et (UI hint için)
// - <MiraChat> Client Component'ine bayrak/data geçir

import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserQuotaStatus } from '@/lib/mira/quota'
import { MiraChat } from './MiraChat'

export const metadata = {
  title: 'Mira ile Sohbet — humanOS',
}

export default async function ChatPage() {
  // ─── 1. AUTH ───
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/chat')
  }

  // ─── 2. PROFILE (selamlamada isim için) ───
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  // ─── 3. QUOTA STATUS ───
  // Service client ile sorgula — RLS bypass, kesin sayı
  const serviceClient = createServiceClient()
  const quota = await getUserQuotaStatus(serviceClient, user.id)

  // ─── 4. GEÇMİŞ MESAJLAR ───
  // Son 50 mesaj (chat UI'da scroll back için yeterli)
  const { data: historyRows } = await serviceClient
    .from('mira_chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  const history = (historyRows ?? []).map((row) => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    createdAt: row.created_at,
  }))

  // ─── 5. ONAYLI RAPOR VAR MI? (UI selamlama farkı için) ───
  const { count: approvedReportCount } = await serviceClient
    .from('ai_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const hasApprovedReport = (approvedReportCount ?? 0) > 0

  // ─── 6. RENDER ───
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-humanos-bg">
      <MiraChat
        firstName={firstName}
        initialHistory={history}
        initialQuota={{
          tier: quota.tier,
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          period: quota.period,
          exhausted: quota.exhausted,
        }}
        hasApprovedReport={hasApprovedReport}
      />
    </div>
  )
}
