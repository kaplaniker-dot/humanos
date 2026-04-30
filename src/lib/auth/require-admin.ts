// src/lib/auth/require-admin.ts
// Day 12 — Admin yetki kontrolü server-side helper
//
// Server Component, Route Handler veya Server Action içinde kullan.
// Kullanım deseni:
//
//   const adminUser = await requireAdmin()
//   // Buraya geldiyse user yetkili
//
// Yetkisiz durumda redirect tetikler — return olmaz, exception fırlatılır,
// Next.js bunu yakalayıp redirect'e çevirir.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type AdminUser = {
  user: User
  fullName: string | null
  role: 'admin' | 'coach'
}

/**
 * Mevcut kullanıcıyı doğrular ve admin/coach rolünde olduğunu garanti eder.
 *
 * Akış:
 * 1. Cookie'den session'ı çek
 * 2. Auth yoksa → /sign-in'e redirect
 * 3. profiles.role kontrolü
 * 4. Rol 'admin' veya 'coach' değilse → /dashboard'a redirect
 * 5. Yetkili → AdminUser objesi döner
 *
 * @throws Next.js redirect (yetkisiz durumda)
 * @returns Yetkili kullanıcı + profile bilgisi
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()

  // ─── Step 1: Auth check ───
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    redirect('/sign-in')
  }

  // ─── Step 2: Role check ───
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    // Profile yoksa beklenmedik durum — güvenli tarafa düş, dashboard'a yolla
    redirect('/dashboard')
  }

  if (profile.role !== 'admin' && profile.role !== 'coach') {
    redirect('/dashboard')
  }

  // ─── Step 3: Yetkili — return ───
  return {
    user,
    fullName: profile.full_name,
    role: profile.role,
  }
}

/**
 * Salt-okunur kontrol — redirect tetiklemez, sadece bool döner.
 *
 * UI conditional render için kullan (örn: nav menüde "Admin" linki göster/gizle).
 *
 * @returns true = yetkili, false = yetkisiz
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return false

  return profile.role === 'admin' || profile.role === 'coach'
}
