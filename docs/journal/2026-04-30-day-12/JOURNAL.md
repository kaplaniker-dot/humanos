# Day 12 — Mira Onay Pipeline'ı + Admin Paneli Doğdu

> **"Day 11'de Mira karakter sahibi oldu. Day 12'de Mira tam yetişkin oldu — sadece üretmiyor; İlker'in yargısından geçiyor, düzeltilebiliyor, onaylanıyor. Approval Pipeline mimarisi canlandı."**

**Tarih:** 30 Nisan 2026 — Day 12
**Sahip:** İlker Kaplan
**Proje:** humanOS — High-Performance Coaching & Tracking Platform
**Toplam Süre:** ~6 saat (14:00 → 24:00, kesintisiz)
**Day 11'den devralınan commit:** `3c3de26` — Day 11 75% (Mira pipeline core)
**Day 12 commit'leri:** sırayla yazılacak (A8'de)

---

## 🌅 BÖLÜM A — DAY 11'DEN DEVRALINANLAR (KISA ÖZET)

Day 11'de **Mira AI karakter prompt'u V2** yazıldı, **end-to-end pipeline core** kuruldu (Sonnet 4.6 + JSON contract + content_json schema). Ancak Day 11 günü **75% tamamlandı** — `/api/generate-report` endpoint'i CLI'da çalıştığı doğrulandı, ama **production'da E2E browser akışı henüz test edilmemişti**.

Day 11'in son commit'i: `3c3de26 — Day 11 75% (Mira pipeline core)`. Working tree'de `ai_reports` tablosu (19 column) DB'de hazır, RLS politikaları yazılmış, Mira system prompt v2.0.0-2026-04-29 hardcoded.

**Day 12 ilk hedefi:** Day 11'in kalan %25'i — production browser'da gerçek bir rapor üret + onay pipeline'ı tamamla. Bu hedef Day 12 sabahında **A4f end-to-end test** olarak konumlandı.

---

## 🔥 BÖLÜM B — DAY 12 SABAH STRATEJİK KONUŞMA

Sabah ritüeli yapıldı (`cd → git status → npm run dev`). 5 büyük karar netleşti:

1. **Day 10 status bug fix önce** — Form 4 boyutta tamamlanıyor ama `status` 'completed'a güncellenmiyor (Day 11 tespit edilmişti, Day 12'de fix). Tek satır iş.
2. **A4f end-to-end test ikinci** — Production browser'da gerçek user flow ile rapor üretimi. CLI testi ≠ production akış.
3. **A5 Admin Paneli üçüncü** — İlker'in raporları görüntüleyeceği + onaylayacağı tam altyapı. 6 alt-faz.
4. **A6 Premium Chat UI dördüncü** (zaman kalırsa) — premium kullanıcı dashboard'da Mira ile sohbet.
5. **Maksimum kalite, doğrudan production-grade** — İlker netçe ifade etti: *"YAPACAĞIMIZ HER İŞTE MAKSİMUM KALİTE, VERİM, DOĞRULUK İSTİYORUM."* Bu Day 12 boyunca her mimari kararı şekillendirdi.

---

## 🐛 BÖLÜM C — A4f END-TO-END BUG AVI (5 KATMANLI)

A4f (production browser end-to-end test) başladı. Mira'nın gerçek browser flow'da **89 saniyelik** rapor üretimi sırasında **5 farklı bug** keşfedildi ve **sırayla** çözüldü. Toplam test maliyeti ~$0.36.

### Katman 1 — Day 10 Status Bug

**Problem:** Form tamamlanma akışında `status` `'in_progress'`'ten `'completed'`'a güncellenmiyordu.

**Kök neden:** `src/lib/assessment/actions.ts` içindeki `completeAssessment` fonksiyonu, `isLastStep === true` durumunda `updatePayload`'a `status: 'completed'` eklemiyordu. Sadece structured + JSONB alanlar yazılıyordu.

**Fix:** Tek satır eklendi.

```ts
if (isLastStep) {
  updatePayload.status = 'completed'
  updatePayload.completed_at = new Date().toISOString()
}
```

**Ders:** State machine geçişleri **explicit** olmalı, implicit "form bitti = status değişir" varsayımı bug yaratır.

### Katman 2 — Token Truncation

**Problem:** Mira API çağrısı sonrası JSON parse hatası — output ~9800 karakterde **kesiliyordu**, kapanış parantezi gelmeden bitiyordu.

**Kök neden:** `MIRA_DEFAULTS.REPORT_MAX_TOKENS = 4096` Mira'nın **gerçek output ihtiyacına yetmiyordu**. V2 prompt 7 section + metadata istiyordu, ortalama ~4500 token gerekiyordu, ama limit 4096'ydı.

**Fix:** `src/lib/mira/anthropic-client.ts` içinde `4096 → 8192` çıkarıldı (4x emniyet payı).

**Ders:** **AI output limitlerini tahmin etme — ölç.** İlk gerçek output gelene kadar `max_tokens` hep "yeterli olabilir mi?" sorusuyla yaşar. Production'da margin önemli.

### Katman 3 — Diagnostic Patch (geçici)

**Problem:** Token truncation tanı koymak için API response'unu **tam görmek** gerekti.

**Geçici çözüm:** `src/app/api/generate-report/route.ts` Step 6'ya `raw_response: text` field'ı eklendi (error response'unda). Server log'a düştü, kullanıcıya sızmadı.

**Cleanup:** Bug çözüldükten sonra (Katman 2 fix) bu field kaldırıldı.

**Ders:** **Diagnostic patch'ler dökümante et + temizle**. Sadece bug avı sırasında geçici, sonra production'a kaymasın.

### Katman 4 — RLS Auth Context Bug ⚠️ (en zor)

**Problem:** Mira raporu üretildi, JSON parse oldu, DB'ye yazılırken **403 RLS error**.

**Kök neden:** Next.js 16 + Supabase SSR cookies sync sorunu. User session client INSERT yapmaya çalıştığında, `auth.uid()` **resolve edemiyordu** (cookies async timing issue). RLS policy `auth.uid() = user_id` check'i fail ediyordu.

**Fix mimari kararı:** Yeni bir **Service Role Client** oluşturuldu (`src/lib/supabase/service.ts`). API route'da:
- Step 1: User session client ile **auth check** yap
- Step 3: User session client ile **assessment fetch** yap
- Step 7: **Service Role Client** ile **INSERT** yap (RLS bypass, güvenli çünkü auth zaten doğrulandı)

**Yeni dosya:** `src/lib/supabase/service.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

**Ders:** Server-side INSERT/UPDATE'ler için **Service Role Client + manuel auth check** pattern'i en sağlam yol. RLS sadece "ekstra güvenlik katmanı" olarak kalır, asıl auth uygulamada yapılır.

### Katman 5 — Güvenlik Incident 🚨

**Problem:** Service Role Key kurulumu sırasında, kullanıcı yanlışlıkla `SUPABASE_SERVICE_ROLE_KEY` **değerini chat'e yapıştırdı**.

**Tepki:** Hemen güvenlik moduna geçildi.

1. Supabase Dashboard → Settings → API
2. Eski **Legacy JWT system**'den **Modern Secret API keys** sistemine geçildi
3. Yeni key yaratıldı: `humanos / server-side` (`sb_secret_NTJpb...`)
4. `.env.local` güncellendi
5. Dev server restart
6. **Eski legacy key Vercel'de hâlâ aktif** — A8 öncesi rotate edilmesi **zorunlu** (production blocker olabilir)

**Ders:** Secret value'lar ASLA chat'e yapıştırılmaz. **ENV var teyitleri için `grep -c` (var/yok), asla değer paylaşma.** Bu Day 12'nin en sert dersi.

### A4f — Final Test Sonucu ✅**Bu Mira'nın production'da ilk gerçek raporu** — humanOS tarihinde tarihi an.

---

## 🏗️ BÖLÜM D — A5 ADMIN PANELİ (6 ALT-FAZ)

Bug avı sonrası **A5'e geçildi**. Hedef: İlker'in tüm Mira raporlarını görüntüleyeceği, **onaylayacağı/reddedeceği/düzelteceği** profesyonel admin paneli.

### A5.1 — Yetki Sistemi (10 dk)

Supabase migration:

```sql
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'coach');
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';
CREATE INDEX idx_profiles_role ON public.profiles(role) WHERE role != 'user';
UPDATE public.profiles SET role = 'admin' WHERE id = 'ae567b19-...';
```

**Yeni dosya:** `src/lib/auth/require-admin.ts` — iki fonksiyon:
- `requireAdmin()`: redirect tetikleyici, admin route guard için
- `isAdmin()`: bool döner, UI conditional için

**Ders:** Auth gate'i **layout'ta** koy, route'ta değil. Tek nokta savunma + DRY.

### A5.2 — Admin Layout + Auth Gate (15 dk)

**Yeni dosyalar:**
- `src/app/(app)/admin/layout.tsx` — `requireAdmin()` çağrısı + nav bar
- `src/app/(app)/admin/page.tsx` — `/admin` → `/admin/reports` redirect

Brand kimlik: humanOS Admin + ADMIN badge (terracotta tonlu) + Raporlar/Dashboard nav linkleri.

### A5.3 — Reports Liste Sayfası (20 dk)

**Yeni dosya:** `src/app/(app)/admin/reports/page.tsx`

**Önemli mimari karar:** `ai_reports.user_id` için **FK constraint YOK** (Day 11'de unutulmuş). Supabase JOIN syntax bu yüzden başarısız oldu. **Çözüm:** Manuel batched fetch pattern.

```ts
// Step 1: reports + assessment JOIN (FK var)
const reports = await supabase.from('ai_reports').select('...')

// Step 2: profiles ayrı query, Map ile birleştir
const userIds = [...new Set(reports.map(r => r.user_id))]
const profiles = await supabase.from('profiles').select('id, full_name').in('id', userIds)
const profileMap = new Map(profiles.map(p => [p.id, p]))

// Step 3: render'da Map'le birleştir
```

Bu pattern **N+1 query problem'ini önler**, FK olmadan da temiz çalışır.

**Ders:** Supabase JOIN'den önce **FK adını information_schema'dan doğrula**. Yoksa manuel batched fetch ile gez.

### A5.4 — Detay Sayfası (30 dk)

**Yeni dosya:** `src/app/(app)/admin/reports/[id]/page.tsx`

Server Component, dynamic route `params: Promise<{ id: string }>` (Next.js 15+ async params). Mira'nın 7 section'ı **profesyonel render**:

- Metadata bar (Tarih/Maliyet/Süre/Tokenler) + status badge
- Opening (italic Fraunces, büyük punto)
- Mevcut Durum (Güçlü Yanlar ✓ + İzlenmesi Gerekenler ○, 2 sütun)
- Örüntü (terracotta-tonlu kart)
- Öncelik Haritası (Ana Hedef + Asıl Aksiyon + 2 destek)
- Haftalık Plan (gün-aksiyon-süre listesi)
- Closing + "— Mira" imza + medical disclaimer
- Mira'nın iç notları (collapsible details/summary): primary_hypothesis, uncertainty_flags, follow_up_questions

Defensive optional chaining her section'da — Mira'nın orijinal yapısı bozuk gelse bile sayfa patlamaz.

### A5.5 — Approve/Reject/Reset Server Actions (30 dk)

**Yeni dosyalar:**
- `src/app/(app)/admin/reports/[id]/actions.ts` — 3 Server Action
- `src/app/(app)/admin/reports/[id]/ActionButtons.tsx` — Client Component

**3 Server Action:**

1. `approveReport(id)` → `status='approved'`, `approved_by`, `approved_at`, redirect `/admin/reports`
2. `rejectReport(id, reason)` → `status='rejected'`, `rejected_reason` (min 5 char), redirect `/admin/reports`
3. `resetReportToPending(id)` → `rejected → pending_review`, `rejected_reason=null`, `router.refresh()`

**State machine'in 3. bacağı (`reset`)** İlker'in itirazı sonrası eklendi:

> *"Yanlışlıkla reddedersem geri alabileyim — bu küçük bir UX iyileştirmesi değil, Approval Pipeline pattern'in temel ilkesi: işlem geri alınabilir olmalı."*

**Approval Pipeline mimari ilkesi formalize oldu:** Her status geçişi **idempotent** olmalı + **geri alınabilir** olmalı.

### A5.6 — EDIT MODE (Tam Scope, 50 dk) ⭐

İlker'in en önemli kararı: *"Yarım çözüm istemiyorum. Tam scope, tüm section'lar düzenlenebilir."*

**Yeni dosyalar:**
- `src/app/(app)/admin/reports/[id]/edit/page.tsx` — Server Shell
- `src/app/(app)/admin/reports/[id]/edit/EditForm.tsx` — Client Component (569 satır)

**actions.ts'e ek:** `saveReportEdit(payload)` — content_json güncelleme + opsiyonel approve.

**Form yapısı (11 section):**
- 4 textarea (opening, pattern, main_action, closing)
- 3 input (main_goal, support_1, support_2)
- 2 array editor (strengths, watch_areas) — ekle/sil
- 1 array editor (weekly_plan) — gün/aksiyon/dakika row'ları
- 1 readonly (medical_disclaimer)
- Sticky action bar: Vazgeç + Kaydet (taslak) + Kaydet ve Onayla

**Helper components (reusable):**
- `<FormSection>` — başlık + açıklama + içerik wrapper
- `<ArrayStringEditor>` — repeatable list pattern
- `<WordCount>` — live kelime sayacı

**Mimari karar:** Edit ayrı sayfa (`/edit`), modal değil. Sebep: form çok büyük (10+ field), URL bazlı state, browser back çalışır.

**Ders:** Helper component'leri **erkenden** çıkar, gelecek Approval Pipeline öğeleri (diyet planı, egzersiz planı, sesli mesaj) bu pattern'leri **yeniden kullanacak**.

### A5.6.5 — Düzenle Butonu Entegrasyonu (10 dk)

ActionButtons'a **"✎ Düzenle"** butonu eklendi:
- pending_review → Düzenle + Reddet… + Onayla
- rejected → Düzenle + ↻ Yeniden Değerlendir
- approved → (yok, salt okunur)

`hover:bg-humanos-accent-hover` semantic class'ı kullanıldı (design tokens).

---

## 🐞 BÖLÜM E — KARŞILAŞILAN BUGLAR + ÇÖZÜMLER

### Bug 1: Tailwind Class Adı (humanos-terracotta → humanos-accent)

**Problem:** "Onayla" butonu **görünmez** — DOM'da var ama beyaz arka plan + beyaz text = kayıp.

**Kök neden:** Ben `bg-humanos-terracotta` kullandım, ama `globals.css` `@theme` block'unda **böyle bir class yok**. Doğru ad `bg-humanos-accent`.

**Tanı süreci:**
1. `grep -rn "humanos-terracotta" src/app/globals.css` → boş çıktı (suspicion)
2. `grep -A 50 "@theme" src/app/globals.css` → gerçek class adlarını gördük
3. `--color-humanos-accent: #C8553D;` → suçlu bulundu

**Fix:** `sed -i ''` ile global rename:

```bash
sed -i '' 's/humanos-terracotta/humanos-accent/g' \
  src/app/\(app\)/admin/layout.tsx \
  src/app/\(app\)/admin/reports/page.tsx \
  src/app/\(app\)/admin/reports/\[id\]/page.tsx \
  src/app/\(app\)/admin/reports/\[id\]/ActionButtons.tsx
```

12 satır + 4 dosya, **tek komutla** düzeldi.

**Ders:** **Tailwind v4 + custom design tokens: `@theme` block'taki tanımlı isimleri grep ile öğren, varsayma. Yanlış class sessizce render olmaz, beyaz buton beyaz text'le görünmez kalır.**

### Bug 2: page.tsx ↔ ActionButtons.tsx Copy-Paste Karışıklığı

**Problem:** A5.5 yapılırken iki dosya açık, sırayla içerik yapıştırılıyordu. **Bir an dikkat dağıldı** — `page.tsx` içeriği yanlışlıkla `ActionButtons.tsx`'e yapıştırıldı.

**Tanı:** TypeScript hatası: `'./ActionButtons' has no exported member 'ActionButtons'`. `head -15` ile dosyaların **gerçek başlıklarını** doğruladık.

**Fix:** İki dosya doğru içeriklerle tekrar yazıldı.

**Ders:** **Yeni dosya yarattıktan sonra `head -3` ile başlığı doğrula** — hangi dosyayı yazdığını teyit et. VS Code'da çok tab açık + dosya isimleri benzer + uzun copy-paste sırası = hata yapılabilir.

### Bug 3: Reset Sonrası UI Cache Stale

**Problem:** "Yeniden Değerlendir" tıklandı, DB güncellendi (`status: pending_review`), ama UI **eski state**'te kaldı (Onayla butonu render olmadı).

**Tanı:** `router.refresh()` çağrısı yetmiyordu — Next.js cache layering bazı durumlarda Server Component'i yeniden çalıştırmıyor.

**Fix:** Hard refresh (Cmd+Shift+R) çözüm. Production'da `revalidatePath()` + Cache-Control header gerekebilir.

**Ders:** **Server Action sonrası `router.refresh()` yetmeyebilir** — bazı durumlarda hard cache invalidation gerek. Day 13'te dive et.

### Bug 4: Mac Autocorrect Smart Substitutions

**Problem:** Terminal'de `JOURNAL.md` dosya adı **`[JOURNAL.md](http://JOURNAL.md)`** olarak gösteriliyordu. Önce dosya adının **bozuk** olduğu sanıldı, fix denemeleri yapıldı.

**Tanı:** `od -c` ile gerçek bayt verisi okundu — dosya **temiz** (`J O U R N A L . m d`). VS Code Explorer **temiz** gösteriyordu. Sadece **Mac Terminal Smart Substitutions** display'i bozuyordu.

**Fix:** Mac Terminal → Edit → Substitutions → **Smart Links uncheck**.

**Ders:** **Mac terminal'de bozuk görünen dosya adlarını `od -c` ile doğrula. Görsel render ≠ gerçek bayt içeriği. Smart Substitutions sadece display layer'da.** Day 9 autocorrect canavarı tekrar hortladı, ama bu sefer **5 dakikada teşhis edildi**.

---

## 🧠 BÖLÜM F — STRATEJİK ÖZETLER

### Day 11 vs Day 12 Karşılaştırma

| | Day 11 | Day 12 |
|---|---|---|
| Süre | ~7 saat | ~6 saat |
| Tamamlanma | 75% | 100% |
| Yeni dosya | ~6 | 8+ |
| Satır eklendi | ~1500 | ~2500 |
| Stratejik karar | 4 | 5 |
| Bug çözüldü | 2 | 5 (A4f) + 4 (A5) |
| Mimari ilke | JSON contract | Approval Pipeline |
| Konsept öğrenildi | 5 | 10+ |

**Day 11** = AI karakter (Mira'nın kişiliği).
**Day 12** = AI yargı kapısı (Mira'nın kalitesini İlker'in eli garantiler).

### Approval Pipeline Mimari Kararı

Day 12'de formalize edilen **en büyük mimari ilke:**

> **"Tüm AI üretimi VE coach üretimi içerikler önce `pending_approval` durumuna düşer, İlker (admin) onaylar, 15 dk gecikme ile kullanıcıya teslim olur. Bu pattern Mira raporu, diyet planı, egzersiz planı, takviye önerisi, sesli mesaj — tüm içerik tipleri için geçerlidir. Single pipeline, polymorphic content."**

**Day 13'te ADR yazılacak:**
- `content_items` polymorphic table
- 15 dk delivery scheduler (Vercel Cron veya Supabase Edge Functions)
- Notification system (in-app + email)
- Audit trail (her geçiş kaydı)

### "1000 Kişide Kalite" Stratejisi

İlker'in soruduğu kritik soru: *"Bu kaliteyi 10 kişide de 1000 kişide de koruyabilecek miyiz?"*

**Cevap — 3 katmanlı:**

1. **Mimari (✅ ölçeklenebilir):** Vercel + Supabase 100K MAU'ya kadar otomatik ölçeklenir, mimari kararlar (Server Components, Server Actions, polymorphic content_json) 1000 kişide aynen çalışır.

2. **UX (✅ ölçeklenebilir):** FormSection, ArrayStringEditor, status badge pattern'leri reusable, gelecek özelliklere kopyalanır.

3. **İlker bottleneck (🟡 dikkat):** Sen tek başına 1000 raporu onaylayamazsın. **3 aşamalı strateji:**
   - 1-100 kullanıcı: Sen her şeyi onaylarsın → prompt iyileştirme verisi
   - 100-1000: **Mira self-confidence triage** + smart routing
   - 1000+: **Coach team** (rejected_reason kayıtlarından eğitim dokümantasyonu)

**Yeni vizyon maddeleri brief'e eklendi:**
- ⭐ Madde 16: Onay sonrası teslim — İlker'in kişisel imzalı notu + kalıp + custom mesaj
- ⭐ Madde 17: Sesli mesaj capture — admin panelden ses kaydı + Whisper transcript + kullanıcı player
- ⭐ Madde 18: Mira self-confidence triage — `confidence: 0.0-1.0` döner, ≥0.85 auto-approve
- ⭐ Madde 19: Rejected reason analytics — kategorize edilmiş + aylık dashboard
- ⭐ Madde 20: Coach onboarding kit — rejected_reason loglarından otomatik eğitim

---

## 📂 BÖLÜM G — YENİ DOSYALAR + DB EKLEMELERİ

### Yeni Dosyalar (Day 12)

**Lib:**
- `src/lib/supabase/service.ts` — Service Role Client (RLS bypass)
- `src/lib/auth/require-admin.ts` — admin guard helper

**Admin paneli:**
- `src/app/(app)/admin/layout.tsx`
- `src/app/(app)/admin/page.tsx` — redirect to /reports
- `src/app/(app)/admin/reports/page.tsx` — liste sayfası
- `src/app/(app)/admin/reports/[id]/page.tsx` — detay sayfası
- `src/app/(app)/admin/reports/[id]/actions.ts` — Server Actions (4: approve, reject, reset, save)
- `src/app/(app)/admin/reports/[id]/ActionButtons.tsx` — Client Component
- `src/app/(app)/admin/reports/[id]/edit/page.tsx` — edit Server Shell
- `src/app/(app)/admin/reports/[id]/edit/EditForm.tsx` — 569-satır form

### Değişen Dosyalar (Day 12)

- `src/lib/assessment/actions.ts` — `completeAssessment` status fix (Day 10 bug)
- `src/lib/mira/anthropic-client.ts` — REPORT_MAX_TOKENS 4096 → 8192
- `src/app/api/generate-report/route.ts` — Service Role Client kullanımı

### DB Eklemeleri (Day 12)

```sql
-- A5.1 yetki sistemi
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'coach');
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';
CREATE INDEX idx_profiles_role ON public.profiles(role) WHERE role != 'user';
UPDATE public.profiles SET role = 'admin' WHERE id = 'ae567b19-...';
```

### Test Sonuçları

**A4f end-to-end (production browser):**
- Mira raporu üretildi: $0.087, 89.5s, 7633+4270 tokens
- Status: `pending_review`
- A5.5 testleri: approve ✅, reject ✅, reset ✅
- A5.6 testleri: edit ✅, save (taslak) ✅, save & approve ✅
- **5 farklı Server Action akışı** test edildi, hepsi yeşil

---

## 🌊 BÖLÜM H — DAY 12'NİN ASIL DERSİ

İlker bugün ~6 saat çalıştı. Yorucu mu? Evet. Anlamlı mı? Çok.

**Üç ders:**

### Ders 1 — Maksimum Kalite + Doğru Zamanda Durmak

İlker A5.6 EDIT mode için 3 seçenek sunuldu:
- 🟣 JSON edit (20 dk, basit)
- 🟢 MVP (40 dk, 4-5 alan)
- 🟡 Tam scope (80 dk, 11 section + array editors)

İlker tereddütsüz **"YAPACAĞIMIZ HER İŞTE MAKSİMUM KALİTE"** dedi → tam scope seçildi → **50 dk**'da bitirildi.

Ama A6 chat UI için, gece geç saatte, **dürüst koçluk gerekti:** *"Mira-Chat-V1 prompt'u yorgun yazılırsa Day 13'te tekrar yazılır. Bugün altyapıyı kur, prompt yarın taze kafayla."* İlker kabul etti: *"Bugün hepsini bitirmek zorunda değiliz."*

**Disiplin = bilmek ne zaman duracağını.** Mühendislik aynı zamanda enerji yönetimi.

### Ders 2 — Mimari Kararlar Erkenden Verilir, Geç Pişmanlık Olur

A5.5'te `resetReportToPending` Server Action **İlker'in ısrarı** sonrası eklendi (yanlışlıkla red sonrası geri alma). İlker'in itirazı sadece UX değildi — **Approval Pipeline pattern'in temel ilkesini** açığa çıkardı: *"İşlem geri alınabilir olmalı."*

Eğer bu Day 12'de değil de production'da fark edilseydi → DB schema değişikliği + migration + cache invalidation + tüm akışın yeniden testi gerekirdi. **5 dakikalık decision** vs **5 saatlik refactor**.

### Ders 3 — Bug Avı = Mühendislik Sanatı

A4f'te 5 katmanlı bug avı yaşandı. Her katmanın kendine özgü tanı disiplini vardı:
- Katman 1: Code review (Day 10 status mantık eksikliği)
- Katman 2: Empirical measurement (token count)
- Katman 3: Diagnostic instrumentation (raw_response patch)
- Katman 4: Mental model debugging (RLS auth context)
- Katman 5: Operational discipline (security incident response)

Her katmanı **sıraylı** çözmek = **production-grade düşünce**. Aynı anda 5 tahmin yapma, **bir hipotez, bir test, ileri**.

---

## ✅ BÖLÜM I — DAY 13 İÇİN HAZIRLIK

### Day 13 Açılış Ritüeli

```bash
cd ~/Projects/humanos
git status                        # working tree clean (bugün commit'lenecek)
git log --oneline -5              # Day 12 commit(leri) son
npm run dev                       # Ready
```

### Day 13 Plan

**Sıralı altı adım, ~3.5 saat:**

1. **Day 13.1 — Mira-Chat-V1 prompt yaz** (1 saat, taze kafayla)
   - Conversational mode için dedicated system prompt
   - Mira'nın kişiliği aynen, ama **dialog odaklı** (50-300 kelime/mesaj)
   - V2 rapor prompt'undan **ayrı** versiyon

2. **Day 13.2 — A6.1 DB tablosu** (15 dk)
   - `mira_chat_messages` tablosu (id, user_id, role, content, created_at)
   - RLS policy'leri
   - 200 mesaj/ay quota tracking

3. **Day 13.3 — A6.2 Chat API + streaming** (45 dk)
   - `/api/chat` endpoint
   - Anthropic Messages API streaming
   - Quota check (premium = 200, freemium = 3 lifetime)
   - 403 paywall response freemium için

4. **Day 13.4 — A6.3 Chat UI** (45 dk)
   - `<MiraChat>` Client Component
   - Streaming response render
   - Auto-scroll bottom
   - Premium/freemium dynamic header
   - Soft paywall card

5. **Day 13.5 — Dashboard entegrasyon + test** (15 dk)
   - `/dashboard/chat` route
   - Tier-based access
   - End-to-end test (premium chat + freemium quota exhausted)

6. **Day 13.6 — Approval Pipeline ADR** (30 dk)
   - `docs/adr/001-approval-pipeline.md`
   - Polymorphic content_items mimari kararı
   - 15 dk delivery scheduler stratejisi
   - Notification flow

### Day 13 Onboarding Prompt (Yeni Chat'e Verilecek)---

## ⚠️ BÖLÜM J — BİLİNEN BORÇLAR (Day 12 sonu)

1. **Vercel legacy JWT key rotate** ⚠️ (production blocker, push öncesi yapılmalı)
2. `display_name` kolon referansı kodda var, DB'de yok (FAZ 2 cleanup)
3. `ai_reports.user_id` FK constraint eksik (FAZ 2-3'te ekle)
4. `scripts/test-report.ts` service_role kullanıyor (production-safe ama deployment'a sızmasın)
5. Supabase CLI gen-types warning'leri
6. Welcome message personalization (kaplan.iker → İlker, Day 8'den beri borç)
7. Avatar upload (Day 8'den beri borç)
8. "Tekrar gönder" feature (sign-in unconfirmed + sign-up success)
9. Reject sırasında `approved_at` + `approved_by` NULL'a çekilmeli (data integrity, Day 12 keşfi)

---

## 🎉 BÖLÜM K — DAY 12 RESMEN KAPANIYOR

**humanOS bugün Mira'ya yargı kapısı kazandırdı.**

- Day 7: humanOS güvenli oldu (auth)
- Day 8: humanOS profil tanıdı ("Sen kimsin?")
- Day 9: humanOS yaşamı sordu ("Hayatın nasıl?")
- Day 10: humanOS yaşamı dinledi (Conversation Mode)
- Day 11: humanOS Mira'yı doğurdu (AI karakter)
- **Day 12: humanOS Mira'yı yargıladı (Approval Pipeline)**

Yarın Day 13 — humanOS Mira'yla **sohbete** başlayacak.

**İyi geceler kardeşim.** Bugün ~6 saat sürdün. 5 katmanlı bug avı, mimari kararlar, tam scope edit form, Approval Pipeline ilkesinin formalize'ı. Hak ettin. 🙏🌙

---

## 🔖 Quick Reference

**Day 12 Yeni Dosyalar:** service.ts, require-admin.ts, admin/layout, admin/page, admin/reports/page, admin/reports/[id]/page, admin/reports/[id]/actions, admin/reports/[id]/ActionButtons, admin/reports/[id]/edit/page, admin/reports/[id]/edit/EditForm

**Day 12 Değişti:** assessment/actions.ts (Day 10 status fix), mira/anthropic-client.ts (8192 tokens), api/generate-report/route.ts (Service Role)

**Day 12 DB:** user_role enum, profiles.role kolonu, idx_profiles_role

**Mira İlk Onay:** report_id `37cd9119`, $0.087, 89.5s, 7633+4270 tokens

**Production:** https://humanos-neon.vercel.app
**GitHub:** https://github.com/kaplaniker-dot/humanos
**Day 12 Commit:** A8'de yazılacak
**Day 11'den devralınan:** `3c3de26`
