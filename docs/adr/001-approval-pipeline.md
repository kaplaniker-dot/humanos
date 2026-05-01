# ADR 001 — Polymorphic Content + Approval Pipeline Pattern

| Özellik | Değer |
|---|---|
| Tarih | 2026-05-01 (Day 13) |
| Durum | **Kabul edildi** |
| Yazar | İlker Kaplan + Claude (senior architect rolü) |
| Bağlantılı | Day 12 journal — Approval Pipeline formalize'ı |

---

## 1. Bağlam

humanOS, kullanıcılara **çok katmanlı yapılandırılmış içerik** sunan bir koçluk + analiz platformudur:

- Yaşam analizi raporu (V1, Day 11-12)
- Diyet planı (Day 14-16 hedefi)
- Egzersiz planı (Day 17 hedefi)
- Takviye önerileri (Day 18+)
- Sesli mesaj (Day 19+)
- Coach insan müdahalesi (premium tier)

Tüm bu içerikler **iki kanaldan** üretilir:
1. **AI üretimi** (Mira via Anthropic API)
2. **Coach üretimi** (İlker veya gelecekteki coach team)

**Problem:** Üretim her zaman **mükemmel olmaz**. Mira yanlış bir öneri verebilir, coach acelede bir şeyi atlayabilir. Production'da kalitesizliği kullanıcıya teslim etmek = marka erozyonu + sağlık riski.

**Day 12'de keşfedilen ihtiyaç:** Tüm üretilmiş içerik **kullanıcıya teslim edilmeden önce** bir kalite kapısından geçmeli. Bu kalite kapısı **insan yargısı** (Day 11-30) sonra **AI self-confidence triage** (100-1000 kullanıcı) sonra **coach team** (1000+) olarak ölçeklenecek.

---

## 2. Karar

### 2.1 Polymorphic content table

Tek bir `content_items` tablosu, tüm içerik tiplerini taşır:

\`\`\`sql
CREATE TYPE content_type_enum AS ENUM (
  'report',          -- Yaşam analizi raporu
  'diet_plan',       -- Diyet planı
  'exercise_plan',   -- Egzersiz planı
  'supplement',      -- Takviye önerisi
  'voice_message',   -- Sesli mesaj
  'coach_note'       -- Coach kişisel notu
);

CREATE TYPE content_status_enum AS ENUM (
  'draft',            -- Üretim sürecinde, henüz tamamlanmadı
  'pending_review',   -- Üretim tamam, admin/coach onayı bekliyor
  'approved',         -- Onaylandı, kullanıcıya teslim edilebilir
  'rejected',         -- Reddedildi (rejected_reason zorunlu)
  'delivered',        -- Kullanıcıya teslim edildi (timestamp ile)
  'archived'          -- Pasifleştirildi (yeni versiyon geldi vb.)
);

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type content_type_enum NOT NULL,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,           -- polymorphic payload
  status content_status_enum NOT NULL DEFAULT 'draft',

  -- Üretim takibi
  generated_by TEXT,                      -- 'mira:v2.0.0' veya 'coach:ilker'
  generation_metadata JSONB DEFAULT '{}', -- tokens, cost, model, timing

  -- Onay akışı
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Teslim
  delivered_at TIMESTAMPTZ,
  delivery_scheduled_for TIMESTAMPTZ,    -- 15 dk gecikmeli teslim için

  -- İlişkiler
  parent_content_id UUID REFERENCES content_items(id),  -- diyet planı → rapora bağlı
  version INT NOT NULL DEFAULT 1,
  superseded_by UUID REFERENCES content_items(id),       -- yeni versiyon

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_items_user ON content_items(user_id);
CREATE INDEX idx_content_items_user_status ON content_items(user_id, status);
CREATE INDEX idx_content_items_pending ON content_items(status) WHERE status = 'pending_review';
CREATE INDEX idx_content_items_user_type_status ON content_items(user_id, content_type, status);
\`\`\`

### 2.2 State machine

İçerik şu durumlar arasında **idempotent** ve **geri-alınabilir** geçişler yapar:

\`\`\`
draft → pending_review → approved → delivered
                       ↘ rejected → pending_review (reset)
                                  ↘ archived
approved → archived (yeni versiyon geldi)
\`\`\`

**Day 12'de keşfedilen ilke:** Her geçiş geri alınabilir olmalı. Yanlışlıkla red → reset, yeni versiyon geldi → archived ama silmeden.

### 2.3 Mira chat bağlam genişlemesi

`/api/chat` route'unun "Onaylı içerik bağlamı" bölümü tek bir rapor yerine **tüm onaylı içerik paketini** Mira'ya verecek:

\`\`\`typescript
const { data: contentItems } = await serviceClient
  .from('content_items')
  .select('content_type, title, content_json, approved_at')
  .eq('user_id', user.id)
  .eq('status', 'approved')
  .order('approved_at', { ascending: false });

const userContext = formatContentPackage(contentItems);
// Mira sistem prompt'una eklenir
\`\`\`

`chat-prompt.ts` "BAĞLAM FARKLILIĞI" bölümü genişletilecek (V1.1+):
- Durum 1: Sadece rapor var
- Durum 2: Rapor + diyet planı
- Durum 3: Rapor + diyet + egzersiz
- Durum 4: Tam paket (rapor + diyet + egzersiz + takviye + bloodwork)
- Durum 5: Henüz hiçbir şey yok (discovery mode)

### 2.4 15 dakika gecikmeli teslim

Onay → "delivered" arasında **15 dakikalık tampon** olacak. Sebep:

1. İlker'in **"yanlış onayladım"** geri alma penceresi
2. Kullanıcı tarafında **anlık değil insan-zamanlı** hissi
3. Voice mode için **ses üretim süresi** (Whisper TTS)

**Implementation:** `delivery_scheduled_for` kolonu + Vercel Cron (her 5 dk çalışır) veya Supabase Edge Function (event-driven).

---

## 3. Düşünülen Alternatifler

### 3.1 Per-content-type ayrı tablolar

`ai_reports`, `diet_plans`, `exercise_plans`, ... ayrı tablolar.

**Reddetme sebepleri:**
- Mira chat bağlamı için **N+1 query problem** (her tip için ayrı sorgu)
- Admin paneli **N+1 listeleme** (her tip için ayrı sayfa)
- State machine **N kez tekrarlanır** (her tabloda aynı status enum + RLS + trigger)
- Yeni içerik tipi eklendiğinde **schema migration + admin sayfa kopyalama**
- "Approval Pipeline pattern, single pipeline" formalize'ına aykırı

### 3.2 Tek polymorphic table + ayrı status table

Status geçmişini ayrı bir `content_status_history` tablosunda tutmak.

**Reddetme sebepleri:**
- Day 13 bütçesi için fazla scope
- Audit trail ihtiyacı şu an düşük (1-100 kullanıcı arası)
- Day 14-20 epic'inde gerekirse eklenebilir, **forward-compatible**

### 3.3 NoSQL document store (Firestore vb.)

Polymorphic content için NoSQL daha doğal görünebilir.

**Reddetme sebepleri:**
- humanOS stack'i Postgres + Supabase (Day 7'den beri)
- RLS ihtiyacı için Postgres native, ek altyapı yok
- JSONB kolon zaten document-store esnekliği veriyor
- Migration maliyeti çok yüksek

---

## 4. Sonuçlar

### Avantajlar

1. **Single pipeline, infinite content types** — yeni içerik tipi eklemek = enum'a değer ekleme + content_json schema dokümantasyonu. Schema migration neredeyse yok.
2. **Admin paneli polymorphic** — Day 12'nin admin sayfası `content_items.status='pending_review'` filtreleyerek tüm tipleri tek listede gösterir. Detay sayfası `content_type`'a göre dinamik render.
3. **Mira chat bağlamı zengin** — tek sorguda tüm onaylı içerik paketi. Selma "100g tavuk yerine ne?" sorduğunda Mira diyet planı + profil + (varsa) bloodwork'ü görür.
4. **Versiyon takibi sağlam** — `version` + `superseded_by` ile içerik evrim'i izlenir. Eski plan silinmez, archived olur, history kalır.
5. **Coach team'e geçiş kolay** — `approved_by` UUID kolonu zaten var, role-based access enum'da hazır.

### Maliyetler

1. **JSONB validation kod tarafında** — Postgres JSONB schema enforce etmez. Her content_type için TypeScript schema (Zod) kullanacağız, write-time validation.
2. **Index karmaşıklığı** — content_type + status + user_id kombinasyonları için composite index'ler. Şu an 4 index, Day 14+ ihtiyaca göre artabilir.
3. **Migration eski tablolardan** — `ai_reports` mevcut data var (37cd9119 onaylı raporu dahil). Day 14'te migration script yazılacak: ai_reports → content_items (content_type='report').

---

## 5. Uygulama Yol Haritası

| Day | İş | Süre | Çıktı |
|-----|-----|------|-------|
| 14 | ADR'yi finalize + content_items migration + ai_reports data migrate | 4-5 saat | content_items tablosu canlı, eski rapor migrate olmuş |
| 15 | Diet plan generator (prompt + endpoint + admin onay) | 5-6 saat | /api/generate-diet-plan çalışıyor |
| 16 | Diet plan continued + ilk Selma diyet planı + onay | 4-5 saat | Selma için canlı diyet planı |
| 17 | Exercise plan generator | 5-6 saat | /api/generate-exercise-plan çalışıyor |
| 18 | Mira chat'te content_items entegrasyonu + chat-prompt.ts V1.1 | 3-4 saat | Mira diyet/egzersiz görüyor |
| 19 | Bloodwork upload + parse (vision API + marker dictionary) | 6-8 saat | Kan tahlili PDF/görsel → DB |
| 20 | End-to-end test: Selma akışı, "100g tavuk yerine ne?" | 3-4 saat | Tam akış canlı |

**Toplam:** ~30-40 saat, **Day 20 deadline**.

---

## 6. Mira Chat Entegrasyonu — Selma Senaryosu

### Senaryo

Selma humanOS premium kullanıcısı. Onaylı içeriği:
- Yaşam analizi raporu (insülin direnci hipotezi, kas kazanımı hedefi)
- Diyet planı (haftalık, gram cinsinden makrolar)
- Egzersiz planı (haftalık 4 antrenman)
- Bloodwork (ApoB takibi, glikoz)

Selma `/dashboard/chat`'e gider, yazar:
> "Salı akşamı diyetimde 100 gram tavuk var. Ben tavuk sevmem, alternatif var mı?"

### Mira'nın görmesi gereken bağlam

\`\`\`json
{
  "report": { "hipotez": "insülin direnci", "hedef": "kas kazanımı" },
  "diet_plan": { "salı_akşam": { "tavuk_göğsü": 100, "salata": 200, ... } },
  "exercise_plan": { "salı": "leg day" },
  "bloodwork": { "apoB": 95, "glucose_fasting": 102 },
  "profile": { "alerji": [], "tercihler": ["MENA mutfağı"] }
}
\`\`\`

### Mira'nın beklenen cevabı (V1.1+ benchmark)

> Salı akşamı için 100 gram tavuk göğsü ≈ 31 g protein. Sana eşdeğer 3 alternatif:
>
> 1. **120 g hindi göğsü** — neredeyse aynı protein/kalori, daha yumuşak doku
> 2. **150 g somon** — omega-3 bonusu, ApoB takibinde olduğun için bu hafta haftalık dengeye iyi gelir
> 3. **180 g nohut + 50 g kefir** — bitkisel yol, posa artar, leg day sonrası iyi gelir
>
> Senin profilinde nohut iyi tolere ediliyor mu? Eğer eminsen 3. seçeneği bu salı dene, geri bildirim ver — sonraki haftayı ona göre ayarlarız.

### Bu cevabı sağlayan üç şey

1. **Diyet planı** → 100g tavuk öğününü tanır, makro hedefi bilir
2. **Bloodwork** → ApoB takibi olduğunu bilir, omega-3 tercihini açıklar
3. **Egzersiz planı** → salı leg day, posa+protein kombinasyonu önerir

**Bu üç bağlam olmadan Mira generic Wikipedia cevabı verir. Approval Pipeline + content_items pattern bu kişiselleştirmeyi mümkün kılar.**

---

## 7. Güvenlik ve Ölçek

### RLS (Row-Level Security)

\`\`\`sql
-- Kullanıcı sadece kendi onaylı içeriklerini görür
CREATE POLICY "Users see own approved content" ON content_items
  FOR SELECT USING (auth.uid() = user_id AND status IN ('approved', 'delivered'));

-- Admin tüm pending_review içerikleri görür
CREATE POLICY "Admins see all pending" ON content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'coach')
    )
  );

-- Service role her şeye erişir (API route'ları için)
CREATE POLICY "Service role full access" ON content_items
  FOR ALL USING (auth.role() = 'service_role');
\`\`\`

### Performance — büyük JSONB sorguları

Bir diyet planı ~10-50 KB JSONB. 1000 kullanıcı × 3 plan = 3000 satır × ortalama 30 KB = **~90 MB**, Supabase free tier çok rahat içinde.

10000 kullanıcı = **~900 MB** — pricing tier'ı düşünmek gerekir, ama mimari sağlam.

### 15 dk delivery scheduler

**Vercel Cron** (önerilen): `vercel.json`'da tanımlanır, 5 dakikada bir `/api/cron/deliver-content` endpoint'ini hit eder. O endpoint `delivery_scheduled_for <= now()` olan ve `status='approved'` olan içerikleri `delivered`'a geçirir, kullanıcıya notification atar.

Alternatif: **Supabase Edge Functions** event-driven (status değiştiğinde tetiklenir). Daha temiz ama Vercel ekosisteminden çıkar.

**Karar:** Vercel Cron, çünkü stack tutarlılığı.

---

## 8. Bağlantılı Kararlar (Day 13'te öğrenilen mini-disiplinler)

### 8.1 Foreign key/group identifier UYGULAMA tarafında üretilir

Day 13'te `mira_chat_messages.session_id` NOT NULL DEFAULT gen_random_uuid() koymuştuk. Ama API'de explicit `null` gönderince DEFAULT atlandı, constraint patladı.

**Kural:** Group identifier (session_id, conversation_id, plan_id) DB DEFAULT'a güvenilmez. Uygulama tarafında `crypto.randomUUID()` ile üret. Sebep: explicit kontrol + race condition önleme + null-handling tutarlılığı.

### 8.2 Tailwind class adları @theme'den grep'le öğrenilir

Day 12'de `humanos-terracotta` bug'ı, Day 13'te `humanos-paper`/`humanos-ink` bug'ı.

**Kural:** Yeni bir Tailwind class kullanmadan önce `grep -E "^\s*--color-humanos" src/app/globals.css` ile gerçek tema haritasını gör. Class adı varsayılmaz.

### 8.3 Görsel render ≠ disk gerçeği

Day 13'te claude.ai chat → terminal yapıştırma zincirinde dosya adları `[X](http://X)` olarak göründü ama disk'te temizdi.

**Kural:** Dosya adı bozuk göründüğünde önce `od -c` ile gerçek bayt içeriğini doğrula. `mv` ile düzeltme denemesi yapma — bozulan görüntü, dosya değil. Dosya adı manipülasyonu için VS Code Rename, wildcard, veya tab completion kullan.

### 8.4 macOS Smart Substitutions

**Kural:** Yeni Mac geliştirici environment setup'ında ilk iş: System Settings → Keyboard → Text Input → "Use smart quotes and dashes" + "Correct spelling automatically" + "Capitalize words automatically" + "Add period with double-space" → hepsi uncheck.

---

## 9. Versiyon Takibi

| Versiyon | Tarih | Değişiklik | Yazar |
|----------|-------|-----------|-------|
| 1.0 | 2026-05-01 (Day 13) | İlk yazım — pattern formalize | İlker + Claude |

ADR güncellemesi gerektiğinde:
- Bu tabloya satır eklenir
- Eski versiyon dosyaya **ek bölüm** olarak kalır (silmeyiz, üstüne yazmayız)
- Major değişiklik = yeni ADR (002, 003, ...)

---

## 10. Onay

Bu ADR Day 13 sonu **commit edilir** (`docs/adr/001-approval-pipeline.md`).

Day 14 sabahı, ADR'nin Section 5 yol haritası başlatılır. content_items migration ile başlar.

**İlker'in 2026-05-01 onayı:** _(commit hash buraya eklenecek Day 14 sabahı)_

🌱
