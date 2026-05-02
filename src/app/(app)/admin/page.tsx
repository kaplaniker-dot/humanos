// src/app/(app)/admin/page.tsx
// Day 12 — Admin root → /admin/reports redirect
//
// /admin URL'sine doğrudan gelen kullanıcıyı liste sayfasına yönlendir.

import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin/reports')
}
