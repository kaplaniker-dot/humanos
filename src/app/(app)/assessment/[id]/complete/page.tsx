// src/app/(app)/assessment/[id]/complete/page.tsx
// Server Component: tamamlama ekranı için auth + ownership + completed_at kontrolü
// Day 10 D4 — Conversation Mode complete screen

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteClient } from './CompleteClient'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AssessmentCompletePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()

  // Auth kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Assessment'ı çek
  const { data: assessment, error } = await supabase
    .from('life_assessments')
    .select('id, user_id, completed_at, selected_dimensions')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !assessment) {
    redirect('/dashboard')
  }

  // Ownership kontrolü
  if (assessment.user_id !== user.id) {
    redirect('/dashboard')
  }

  // Completed_at kontrolü — eğer henüz tamamlanmamışsa, step 1'e gönder
  if (!assessment.completed_at) {
    redirect(`/assessment/${id}/step/1`)
  }

  // Kullanıcının ismini auth metadata'dan veya profiles'dan çek
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name?.split(' ')[0] ?? 'Dostum'

  return (
    <CompleteClient
      userName={userName}
      assessmentId={id}
      dimensionCount={assessment.selected_dimensions?.length ?? 4}
    />
  )
}
