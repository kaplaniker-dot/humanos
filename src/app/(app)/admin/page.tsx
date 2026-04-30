// src/app/(app)/admin/page.tsx
// Day 12 — /admin root → reports'a redirect

import { redirect } from 'next/navigation'

export default function AdminRootPage() {
  redirect('/admin/reports')
}
