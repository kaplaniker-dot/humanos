# humanOS — Master Brief

> **High-Performance Coaching & Tracking Platform**
> Türkçe/MENA odaklı, premium SaaS

**Sahip:** İlker Kaplan
**Repo:** ~/Projects/humanos
**Production:** https://humanos-neon.vercel.app
**GitHub:** https://github.com/kaplaniker-dot/humanos
**Son güncelleme:** 30 Nisan 2026 (Day 12 sonu)

---

## 🌅 Açılış — humanOS Nedir

humanOS, **yüksek performans + sağlık + yaşam kalitesi**'ni kohezif bir sistem olarak tasarlayan bir platform. Kullanıcı kendi yaşamını **6 boyutta** analiz eder (Beslenme, Egzersiz, Kan, Alışkanlıklar, Uyku, Sosyal), Mira (AI asistan) yorum üretir, İlker veya coach onaylar, kullanıcıya kişiselleştirilmiş plan ulaşır.

**Felsefe:** *"Hayatı optimize etmek değil, dizayn etmek."*

---

## 🎯 Tier Sistemi

| Tier | Özellikler | Fiyat |
|---|---|---|
| **Free Funnel** | 1 ücretsiz AI rapor + 3 chat sorusu | Ücretsiz |
| **Premium Self** | Sınırsız Mira chat (200 mesaj/ay) + diyet/egzersiz planları + onay sistemi | TBD |
| **Premium Coaching** | Premium Self + İlker görüşmesi + manuel planlar + sesli mesaj | TBD |

---

## 🏗️ Mimari İlkeler

### Approval Pipeline Pattern (Day 12'de formalize edildi)

> Tüm AI üretimi VE coach üretimi içerikler önce `pending_approval` durumuna düşer, İlker (admin) onaylar, 15 dk gecikme ile kullanıcıya teslim olur. Bu pattern Mira raporu, diyet planı, egzersiz planı, takviye önerisi, sesli mesaj — tüm içerik tipleri için geçerlidir. **Single pipeline, polymorphic content.**

### Kalite Garantisi

- Her rapor `rejected_reason` kaydı tutar → prompt iyileştirme verisi
- `approved_by` audit trail
- Status state machine: `pending_review` → `approved` / `rejected` ↔ (idempotent + reversible)
- 1-100 kullanıcı: İlker tüm onayları yapar
- 100-1000: Mira self-confidence triage
- 1000+: Coach team

---

## 🗺️ Master Yarım İş Haritası

### FAZ 1 (Hafta 1) — Foundation ✅ TAMAMLANDI
- ✅ Auth (Day 7)
- ✅ Profile sistemi (Day 8)
- ✅ Comprehensive Life Analysis gateway (Day 9)
- ✅ Multi-step form + Conversation Mode (Day 10)
- ✅ Mira AI karakter + rapor pipeline (Day 11)
- ✅ Admin paneli + Approval Pipeline core (Day 12)

### FAZ 2 (Hafta 2) — Premium Self Foundation
- 7. A6 Premium Mira Chat UI (Day 13)
- 8. Mira-Chat-V1 dedicated prompt (Day 13)
- 9. Quota tracking sistemi (premium 200/ay, freemium 3 lifetime)
- 10. Approval Pipeline ADR — content_items polymorphic mimari (Day 13)
- 11. Avatar upload + welcome personalization (Day 8 borçları)
- 12. "Tekrar gönder" feature

### FAZ 3 (Hafta 2-3) — Approval Pipeline Ekosistemi
- 13. Diyet planı modu → Approval Pipeline + 15 dk delay
- 14. Egzersiz planı modu → Approval Pipeline + 15 dk delay
- ⭐ 15. **Approval Pipeline foundation** (ANA MİMARİ) — `content_items` polymorphic table + scheduler
- ⭐ 16. **Onay sonrası teslim sistemi** — İlker imzalı not + kalıp + kullanıcı bildirim alanı + email + in-app
- ⭐ 17. **Sesli mesaj capture** — admin panel "Ses kaydet" + MediaRecorder + Supabase Storage + Whisper transcript
- 18. Mira Mod Sistemi mimari evrim

### FAZ 4 (Hafta 3-4) — Kalite Sistemleri
- ⭐ 19. **Mira Self-Confidence triage** — confidence: 0.0-1.0; ≥0.85 auto-approve, 0.65-0.85 İlker'e düşer, <0.65 ek soru
- ⭐ 20. **Rejected Reason Analytics** — kategorize edilmiş red sebepleri + aylık dashboard + prompt iyileştirme
- ⭐ 21. **Coach Onboarding Kit** — rejected_reason loglarından otomatik eğitim dokümantasyonu

### FAZ 5 (Hafta 4-5) — PDF + Email + Lead Magnet
- 25. PDF export (Resend ile email lead magnet)
- 26. Founding Member pre-launch sistemi

### FAZ 6 (Hafta 5+) — Premium Coaching
- 22. Calendly entegrasyonu + webhook
- ⭐ 23. **Coach manual content assignment** — admin panelden kullanıcıya diyet/egzersiz atama
- 24. Stripe entegrasyonu (founding member payments)
- 27. Localized food database (Türk mutfağı moat)

---

## 📚 Mühendislik Dersleri (Birikimli)

### Day 7-9 (Foundation)
- Server vs Client Component sınırı (veri akışıyla çiz)
- RLS pattern (auth.uid() = id her policy'de)
- PostgreSQL triggers + SECURITY DEFINER
- useClickOutside hook (cleanup)
- Component variant pattern
- Hybrid Server+Client pattern
- router.refresh() (cache bust)
- Hybrid C schema pattern (structured + JSONB)
- Supabase RPC function (SECURITY DEFINER + RLS bypass)
- WITH CHECK clause (UPDATE policy için kritik)
- Mac autocorrect bypass: lowercase identifier

### Day 10-11 (Conversation + AI)
- Discriminated union state pattern
- Confirm UI pattern (2-step destructive action)
- AI character system prompts (V1 → V2 iterasyonu)
- JSON contract pattern (LLM output schema)
- Anthropic SDK error handling

### Day 12 (Admin + Approval Pipeline)
1. WIP commit kısa, final commit detaylı
2. Server Action sonrası `router.refresh()` yetmeyebilir — production'da `revalidatePath()` + Cache-Control header
3. AI output limitlerini tahmin etme — ölç (REPORT_MAX_TOKENS 4096→8192 bug)
4. Supabase JOIN'den önce FK adını `information_schema`'dan doğrula; yoksa manuel batched fetch pattern (Map ile birleştir)
5. ENV var teyitleri için `grep -c`, ASLA değer paylaşma — secret value'lar ASLA chat'e yapıştırılmaz
6. Yeni dosya yarattıktan sonra `head -3` ile başlığı doğrula — copy-paste karışıklığı önle
7. Auth gate'i layout'ta koy, route'ta değil — DRY + tek nokta savunma
8. Tailwind v4 + custom design tokens: `@theme` block'taki tanımlı isimleri grep ile öğren, varsayma — yanlış class sessizce render olmaz
9. Sed find-replace ile global rename — VS Code Cmd+Shift+H'tan hızlı, tek komut
10. Reject sırasında `approved_at` + `approved_by` NULL'a çekilmeli — data integrity (FAZ 2 cleanup)
11. Mac terminal'de bozuk görünen dosya adlarını `od -c` ile doğrula — Smart Substitutions sadece display layer'da

---

## ⚠️ Bilinen Borçlar (Day 12 sonu)

1. ⚠️ **Vercel legacy JWT key rotate** (production blocker, push öncesi yapılmalı)
2. `display_name` kolon referansı kodda var, DB'de yok (FAZ 2 cleanup)
3. `ai_reports.user_id` FK constraint eksik (FAZ 2-3'te ekle)
4. `scripts/test-report.ts` service_role kullanıyor (deployment'a sızmasın)
5. Supabase CLI gen-types warning'leri
6. Welcome message personalization (kaplan.iker → İlker, Day 8 borç)
7. Avatar upload (Day 8 borç)
8. "Tekrar gönder" feature (sign-in unconfirmed + sign-up success)
9. Reject sırasında `approved_at` + `approved_by` NULL'a çekilmeli

---

## 🎯 Stack Snapshot

**Frontend:**
- Next.js 16 App Router
- TypeScript
- Tailwind v4 (custom design tokens)
- Server Components + Server Actions

**Backend:**
- Supabase (Frankfurt) — Auth + Postgres + RLS
- Resend (SMTP)
- Vercel hosting

**AI:**
- Anthropic Messages API
- Claude Sonnet 4.6 (`claude-sonnet-4-6`) — premium reports + chat
- Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — freemium chat

**Brand:**
- Paper theme: cream `#FAF7F2` + terracotta accent `#C8553D`
- Fraunces (serif) + Inter (sans) + JetBrains Mono
- Türkçe UI, English code, "sen" form (informal)

---

## 🌱 Disiplin Kuralları

- **TEK ADIM kuralı** (her zaman, bir adım sonra confirmation)
- **3-kontrol protokolü** (syntax + grep + behavior)
- **Tam dosya copy-paste** (no partial diffs)
- **Mac autocorrect bypass:** lowercase identifier
- **Sabah ritüeli:** `cd → git status → git log → npm run dev`

---

## 🔗 İlgili Dökümanlar

- Daily journals: `docs/journal/YYYY-MM-DD-day-NN/JOURNAL.md`
- ADR'ler (Day 13+): `docs/adr/`
- Mira system prompts: `src/lib/mira/system-prompts/` (versioned)
