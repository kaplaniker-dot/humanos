# Day 14 — content_items Polymorphic Mimari + Premium Vizyonun Doğuşu

**Tarih:** 2 Mayıs 2026, Cuma
**Süre:** ~6.5 saat (09:00 — 15:30)
**Mira sürümü:** v2.0.0-2026-04-29 (değişmedi) + Mira Chat v1.0.0-2026-05-01

---

## TL;DR (3 cümle)

Day 13'te Mira'nın bağlam kapısı `ai_reports` tablosundan açılırken, Day 14'te bu kapıyı **polymorphic `content_items` tablosuna** taşıdık — kod tarafında 4 admin dosyası + chat API refactor edildi, EditForm.tsx'in 569 satırı **hiç değişmeden** uyumlu kaldı (interface stable, implementation değişti). Day 12'nin onaylı raporu (37cd9119) idempotent migration ile yeni eve taşındı (a1e0c91a) ve Mira browser test'inde **yeni adresten beslenip** kişisel cevap verdi. Bugünün asıl hediyesi: kod sayfasında değil, sohbet sayfasında doğdu — **6 sekmeli premium humanOS vizyonu, Apple Watch entegrasyonu, 3 katmanlı operasyonel olgunluk, egzersiz kütüphanesi mimarisi** — bu dört konuşma Day 15-50 takvimini şekillendirdi ve mimari tarafında bugün kurduğumuz polymorphic temel, hepsinin fiziksel zemini olduğu kanıtlandı.

---

## 1. Bugün Tamamlananlar

### Day 14.1 — content_items Polymorphic Tablosu

Supabase Studio'da SQL migration:
- 2 enum: `content_type_enum` (report, diet_plan, exercise_plan, supplement, voice_message, coach_note), `content_status_enum` (draft, pending_review, approved, rejected, delivered, archived)
- 1 tablo: `content_items` (20 kolon)
- 6 index (kullanıcı, durum, polymorphic queries, partial index for pending_review, unique source tracking, PK)
- 3 RLS policy (kullanıcı kendi onaylısını, admin tümünü, service_role full)
- 1 trigger (updated_at auto)

ADR 001 Section 2.1'in fiziksel implementasyonu **disk'te canlı**.

### Day 14.2 — ai_reports → content_items Data Migration

`scripts/migrate-ai-reports-to-content-items.ts` — 250 satırlık idempotent TypeScript script.

İdempotency mekanizması: content_items'taki `(source_table, source_id)` üzerinde unique index. Aynı script 2 kez çalıştırılsa duplicate yok.

Akış:
1. DRY RUN ile önce gözlendi (1 satır taşınacak görüldü)
2. Gerçek çalıştırma yapıldı (1 satır eklendi)
3. İkinci çalıştırma yapıldı (0 yeni, 1 atlandı — idempotency kanıtlandı)

Day 12'nin onaylı raporu `37cd9119-0020-...` → content_items'ta yeni ID `a1e0c91a-7a27-...` olarak yaşıyor. Status `approved`, cost $0.0869, tokens 7633+4270.

**Karar:** ai_reports tablosu **dokunulmadı**. Day 16+'da archived/dropped olacak. Rollback güvencesi.

### Day 14.3 — Admin Paneli Refactor (4 dosya)

| Adım | Dosya | Değişiklik | Süre |
|------|-------|------------|------|
| 14.3.a | `admin/reports/page.tsx` | Liste, content_items query + content_type='report' filter + migration badge | 25 dk |
| 14.3.b | `admin/reports/[id]/page.tsx` | Detail, JSONB metadata erişimi + defensive content_type guard | 20 dk |
| 14.3.c | `admin/reports/[id]/actions.ts` | 4 server action (approve, reject, reset, save) → content_items | 15 dk |
| 14.3.d | `admin/reports/[id]/edit/page.tsx` | Edit shell, content_items + redirect mantığı | 10 dk |

**Mimari kazanım:** EditForm.tsx (569 satır) **hiç dokunulmadı**. Sebep: Server Component (page.tsx) DB'den çeker, Client Component (EditForm) sadece prop alır. content_json schema değişmediği için form unaware kaldı. Bu pattern Day 18+ diet/exercise UI'ları yazılırken **70% kod yeniden kullanılabilir** demek.

### Day 14.4 — Chat API content_items'a Bağlandı

`src/app/api/chat/route.ts` Step 5 refactor:
- `from('ai_reports')` → `from('content_items')`
- `eq('content_type', 'report')` defensive guard eklendi
- Yorum: "Day 18+ polymorphic genişleme için future-ready: content_type IN (...)"

Browser test: Mira "İlker, 36 yaşındasın, pre-diyabet riski var, kas kazanımı hedefin var, stres seviyesi 7/10..." diye **kişisel cevap** verdi — kanıt: rapor bağlamı yeni adresten doğru fetch edildi. Quota 1 → 0, freemium limiti doldu.

---

## 2. Bugün Çözülen Bug'lar

### Bug 1 — Day 12 Bug 2 Tekrarı: page.tsx ↔ admin/page.tsx Karışıklığı

**Belirti:** Day 14.3.a refactor sonrası `npx tsc --noEmit` 7 hata verdi. Hatalar `admin/page.tsx`'te (yanlış dosya), oysa refactor `admin/reports/page.tsx` içindi.

**Teşhis:** `head -10` ile iki dosyanın gerçek içeriği karşılaştırıldı:
- `admin/page.tsx` → benim verdiğim Day 14.3.a refactor (yanlış yer)
- `admin/reports/page.tsx` → hâlâ Day 12 orijinal (refactor yapılmadı)

**Sebep:** VS Code'da yapıştırma sırasında yanlış tab seçildi. Day 12 Bug 2'nin tıpkısının aynısı.

**Çözüm:** İki dosya tek seferde sıfırdan yazıldı, doğru içeriklerle:
- `admin/reports/page.tsx` → Day 14.3.a refactor
- `admin/page.tsx` → Day 12 redirect (eski hâli)

**Lesson — pekiştirildi:** VS Code tab adı yapıştırma öncesi okunmalı, head -3 sonrası teyit edilmeli. Bu disiplin Day 12'de yazılmıştı, Day 14'te birebir tekrar geldi → demek ki **disiplin yazılmakla yetmiyor, pekiştirilmeli**.

### Bug 2 — TypeScript JSX Parser ve Çok Satırlı Generic Syntax

**Belirti:** İlk Day 14.3.a yapıştırmasında `Record<string, unknown>` generic'i 3 satıra bölündüğünde 7 syntax hatası.

**Teşhis:** TSX parser çok satırlı generic'leri JSX expression olarak yorumlamaya çalışıyor.

**Çözüm:** Intermediate değişken kullan, generic tek satıra al:
```typescript**Lesson:** JSX dosyalarında kompleks generic'ler **daima tek satır**.

### Bug 3 — Mac Smart Substitutions / Markdown Auto-Link (Day 13 Bug 4 Tekrarı)

**Belirti:** `git diff` ve `grep` çıktıları chat'imize geldiğinde `user.id` ifadeleri `[user.id](http://user.id)` olarak görünür.

**Teşhis (Day 13'te öğrenmiştik):** `od -c` ile diskteki gerçek byte'lar gösterildi → kod **temiz**. Sadece **terminal → chat aktarımı** sırasında markdown auto-link uygulanıyor.

**Çözüm:** Endişelenmek değil, doğrulamak. `od -c` her durumda gerçeği söyler. Day 14'te 3. tekrar (chat → terminal paste, git diff, ls çıktısı) — pattern artık **takım kültürü**.

**Lesson — pekiştirildi:** Visual render ≠ disk reality. `od -c always tells the truth`.

### Bug 4 — Kozmetik Çift // (Find&Replace Yan Etkisi)

**Belirti:** Day 14.4 başlık güncellemesi sonrası `head -3` çıktısında `// // Mira Chat API` görüldü.

**Sebep:** Find&Replace ile başlık değiştirilirken eski `//` silinmedi, yenisi yapıştırıldı.

**Çözüm:** Tek `//` silindi.

**Lesson:** Find&Replace sonrası **head -3** ile sonuç doğrulanmalı. Mantığa zarar yoktu ama future-self'in temizlik standardı.

---

## 3. Bugünün Mimari Kazanımı

content_items polymorphic mimarisinin **gerçek değeri** Day 14'te 4 yerden kanıtlandı:

### a) EditForm.tsx Dokunulmadan Uyumlu Kaldı
569 satır kod, content_json schema değişmediği için sıfır karakter değişti. **Soyutlama kazandırdı.**

### b) ActionButtons.tsx Dokunulmadan Uyumlu Kaldı
Client Component sadece function signature'ları çağırıyordu. Implementation değişti, interface aynı kaldı. **Pattern: interface stable, implementation değişir.**

### c) Idempotent Migration Production Data'ya Güvenle Dokundu
Day 12'nin gerçek production data'sı (ilk onaylı Mira raporu) 2 kez migrate çalıştırılmasına rağmen tek kayıt olarak yeni eve taşındı. **Üretim verisi hiç tehlikeye girmedi.**

### d) Polymorphic Genişleme Future-Ready
Day 15'te diet_plan, Day 17'de exercise_plan, Day 19'da bloodwork content_type'ları aynı tabloya akacak — mimari tarafında **0 ek değişiklik gerekecek**. Sadece prompt + UI eklenecek.

ADR 001 Section 2.1 yazılırken bu kazanımları hayal etmiştik. Bugün kanıtlandı.

---

## 4. Bugünün Hediyesi — Premium humanOS Vizyonu Doğdu

Saat 12:00 civarı İlker bir soru sordu: "Mira'nın haftalık planı genel geçer geldi. Premium kullanıcı için kaliteli bir şey istiyorum. 6 sekmeli bir panel olsa nasıl olur?"

Bu soru bugünün tahmin edilemeyen sonucu oldu. 3 saat süren mimari konuşma açıldı, sonunda 4 yeni vizyon belgelendi (detaylar SCRATCH.md'de):

1. **Premium humanOS — 6 Sekme + 4 Paket + Çapraz Bağ:** Beslenme, Egzersiz, Kan Tahlili, Alışkanlıklar, Sleep, Sosyal sekmeleri. Mira her analiz sonrası 4 paket üretiyor (diet_plan, exercise_plan, bloodwork_analysis, habits_intervention). Paketler birbirini biliyor (kan tahlili → diyet ayarı → egzersiz kalibrasyonu).

2. **Apple Watch Entegrasyonu — 3 Seviye:** Day 23-26 manuel XML, Day 35+ Vital.io, Day 50+ native iOS. Başlangıç ucuz, ölçek aşamasında pahalı.

3. **Operasyonel Olgunluk — 3 Katmanlı Müdahale:** Önleme (TS, ADR, idempotent), erken tespit (Sentry, Vercel Analytics, Supabase Pro backups), müdahale (feature flags, rollback, status page). Yatırım ~6 saat dağıtık + $25/ay. ADR 003 Day 22'de yazılır.

4. **Egzersiz Kütüphanesi — Seviye 2.5:** 200 hareket statik kütüphane (exercise_library tablosu) + Mira'nın kişisel açıklamaları + geri bildirim döngüsü. Form düzeltme AI Day 60+. Maliyet ~$700-1900 başlangıç + $30-50/ay video hosting. ADR 004 Day 24'te yazılır.

Yenilenmiş takvim Web → Mola → App akışıyla:
- **Day 14-26 (web full aksiyon):** content_items refactor → diet plan → exercise plan → bloodwork → 6 sekme → Stripe → Sentry → Apple Health Seviye 1
- **Day 27-30 (bilinçli mola):** İlk premium kullanıcı verisi gözlemi
- **Day 31-50 (app inşası):** React Native veya Swift → web ile senkron 6 sekme → HealthKit native → App Store

Toplam: **~37 çalışma günü = 7-8 hafta**. Day 50'de tam vizyon canlı.

**Kritik fark:** Bu vizyonlar bugün kurduğumuz polymorphic mimari **olmadan** uygulanamazdı. content_items + Approval Pipeline + Service Role pattern = vizyonun fiziksel zemini. Bugünkü "altyapı taşıma" işi, önümüzdeki 7-8 haftanın **mümkünlük koşulu**.

---

## 5. Bugünün Disiplin Notları

- **VS Code tab teyidi şart**: Day 12 Bug 2 birebir tekrar etti. Disiplin yazılmakla bitmiyor, **her dosya açılışında pekiştirilmeli**.
- **head -3 yapıştırma sonrası ritüel**: Hiç istisnasız. Day 14'te bu ritüel olmadığı yerde 7 hatalı yapıştırma yaşadık.
- **od -c gerçeği söyler**: Terminal/chat görüntüsü markdown auto-link ile bozulabilir. Disk içeriği şüpheliyse `od -c | head -5` her zaman.
- **JSX'te tek satır generic**: Çok satır generic + JSX = parser kafayı yer.
- **Find&Replace sonrası head -3**: Kozmetik bug'lar yarın açtığında utandırıcı.

---

## 6. Day 15 Hazırlığı — Diet Plan Generator

Yarın açıldığında ilk iş:
