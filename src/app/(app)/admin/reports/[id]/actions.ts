// src/app/(app)/admin/reports/[id]/actions.ts
// Day 12 — Admin: Rapor Onay/Red/Reset/Edit Server Actions
// Day 12 A5.5 — approve, reject
// Day 12 patch — resetReportToPending eklendi (rejected → pending_review geri al)
// Day 12 A5.6.1 — saveReportEdit eklendi (content_json düzenleme)
//
// Auth: requireAdmin() guard her action'da çağrılır.

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type ActionResult =
  | { success: true }
  | { success: false; error: string }

// Edit payload — ne gelmeli formdan
export type EditReportPayload = {
  reportId: string
  contentJson: Record<string, unknown> // tam content_json objesi
  approveAfterSave: boolean // true → kaydet ve onayla, false → sadece kaydet
}

// ═══════════════════════════════════════════════════
// ACTION: approveReport
// ═══════════════════════════════════════════════════

export async function approveReport(reportId: string): Promise<ActionResult> {
  const adminUser = await requireAdmin()

  if (!reportId || typeof reportId !== 'string') {
    return { success: false, error: 'Geçersiz rapor ID' }
  }

  const supabase = createServiceClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('ai_reports')
    .select('id, status')
    .eq('id', reportId)
    .single()

  if (fetchErr || !existing) {
    return { success: false, error: 'Rapor bulunamadı' }
  }

  if (existing.status !== 'pending_review') {
    return {
      success: false,
      error: `Rapor zaten ${existing.status} durumunda`,
    }
  }

  const { error: updateErr } = await supabase
    .from('ai_reports')
    .update({
      status: 'approved',
      approved_by: adminUser.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (updateErr) {
    console.error('[approveReport] Update error:', updateErr)
    return { success: false, error: 'Onay kaydedilemedi' }
  }

  revalidatePath('/admin/reports')
  revalidatePath(`/admin/reports/${reportId}`)
  redirect('/admin/reports')
}

// ═══════════════════════════════════════════════════
// ACTION: rejectReport
// ═══════════════════════════════════════════════════

export async function rejectReport(
  reportId: string,
  reason: string,
): Promise<ActionResult> {
  await requireAdmin()

  if (!reportId || typeof reportId !== 'string') {
    return { success: false, error: 'Geçersiz rapor ID' }
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return {
      success: false,
      error: 'Red sebebi en az 5 karakter olmalı',
    }
  }

  const supabase = createServiceClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('ai_reports')
    .select('id, status')
    .eq('id', reportId)
    .single()

  if (fetchErr || !existing) {
    return { success: false, error: 'Rapor bulunamadı' }
  }

  if (existing.status !== 'pending_review') {
    return {
      success: false,
      error: `Rapor zaten ${existing.status} durumunda`,
    }
  }

  const { error: updateErr } = await supabase
    .from('ai_reports')
    .update({
      status: 'rejected',
      rejected_reason: reason.trim(),
    })
    .eq('id', reportId)

  if (updateErr) {
    console.error('[rejectReport] Update error:', updateErr)
    return { success: false, error: 'Red kaydedilemedi' }
  }

  revalidatePath('/admin/reports')
  revalidatePath(`/admin/reports/${reportId}`)
  redirect('/admin/reports')
}

// ═══════════════════════════════════════════════════
// ACTION: resetReportToPending
// ═══════════════════════════════════════════════════

export async function resetReportToPending(
  reportId: string,
): Promise<ActionResult> {
  await requireAdmin()

  if (!reportId || typeof reportId !== 'string') {
    return { success: false, error: 'Geçersiz rapor ID' }
  }

  const supabase = createServiceClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('ai_reports')
    .select('id, status')
    .eq('id', reportId)
    .single()

  if (fetchErr || !existing) {
    return { success: false, error: 'Rapor bulunamadı' }
  }

  if (existing.status !== 'rejected') {
    return {
      success: false,
      error: `Sadece reddedilmiş raporlar yeniden değerlendirilebilir. Mevcut durum: ${existing.status}`,
    }
  }

  const { error: updateErr } = await supabase
    .from('ai_reports')
    .update({
      status: 'pending_review',
      rejected_reason: null,
    })
    .eq('id', reportId)

  if (updateErr) {
    console.error('[resetReportToPending] Update error:', updateErr)
    return { success: false, error: 'Sıfırlama yapılamadı' }
  }

  revalidatePath('/admin/reports')
  revalidatePath(`/admin/reports/${reportId}`)

  return { success: true }
}

// ═══════════════════════════════════════════════════
// ACTION: saveReportEdit
// Mira raporunu section bazlı düzenleme — content_json güncelle.
// approveAfterSave=true ise aynı zamanda status='approved' yapar.
// ═══════════════════════════════════════════════════

export async function saveReportEdit(
  payload: EditReportPayload,
): Promise<ActionResult> {
  const adminUser = await requireAdmin()

  // ─── Validation: temel ───
  if (!payload.reportId || typeof payload.reportId !== 'string') {
    return { success: false, error: 'Geçersiz rapor ID' }
  }

  if (!payload.contentJson || typeof payload.contentJson !== 'object') {
    return { success: false, error: 'İçerik geçersiz' }
  }

  const supabase = createServiceClient()

  // ─── Mevcut rapor kontrolü ───
  const { data: existing, error: fetchErr } = await supabase
    .from('ai_reports')
    .select('id, status')
    .eq('id', payload.reportId)
    .single()

  if (fetchErr || !existing) {
    return { success: false, error: 'Rapor bulunamadı' }
  }

  // Sadece pending_review veya rejected düzenlenebilir
  if (existing.status !== 'pending_review' && existing.status !== 'rejected') {
    return {
      success: false,
      error: `${existing.status} durumundaki raporlar düzenlenemez`,
    }
  }

  // ─── Content schema validation (defensive) ───
  // Sections object'i mutlaka olmalı
  const sections =
    typeof payload.contentJson === 'object' &&
    payload.contentJson !== null &&
    'sections' in payload.contentJson
      ? (payload.contentJson as { sections?: unknown }).sections
      : null

  if (!sections || typeof sections !== 'object') {
    return {
      success: false,
      error: 'İçerik yapısı bozuk: sections bulunamadı',
    }
  }

  // ─── Update payload hazırla ───
  const updatePayload: Record<string, unknown> = {
    content_json: payload.contentJson,
  }

  if (payload.approveAfterSave) {
    updatePayload.status = 'approved'
    updatePayload.approved_by = adminUser.user.id
    updatePayload.approved_at = new Date().toISOString()

    // Eğer reddedilmiş raporu düzenlerken onaylıyorsak red sebebini temizle
    if (existing.status === 'rejected') {
      updatePayload.rejected_reason = null
    }
  }

  // ─── Update ───
  const { error: updateErr } = await supabase
    .from('ai_reports')
    .update(updatePayload)
    .eq('id', payload.reportId)

  if (updateErr) {
    console.error('[saveReportEdit] Update error:', updateErr)
    return { success: false, error: 'Kayıt başarısız' }
  }

  // ─── Cache invalidation ───
  revalidatePath('/admin/reports')
  revalidatePath(`/admin/reports/${payload.reportId}`)
  revalidatePath(`/admin/reports/${payload.reportId}/edit`)

  // ─── Redirect ───
  if (payload.approveAfterSave) {
    redirect('/admin/reports')
  } else {
    redirect(`/admin/reports/${payload.reportId}`)
  }
}
