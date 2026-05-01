# Day 13 — Mira Konuştu, Approval Pipeline Mimari Olarak Doğdu

> **"Day 11'de Mira karakter sahibi oldu. Day 12'de Mira yargı kapısından geçti. Day 13'te Mira **gerçek kullanıcılarla konuşmaya başladı** — ve gelecek tüm AI üretiminin (diyet, egzersiz, kan tahlili) mimari iskeleti ADR olarak donduruldu."**

**Tarih:** 1 Mayıs 2026 — Day 13
**Sahip:** İlker Kaplan
**Proje:** humanOS — High-Performance Coaching & Tracking Platform
**Toplam Süre:** ~6 saat (12:00 → 18:00 hedefi, gerçek ~15:00 kapanış)
**Day 12'den devralınan commit:** `865d7bb` — Day 12 part 2 (Admin panel + Approval Pipeline complete)
**Day 13 commit'leri:**
- `b800f3c` — Day 13 part 1 (Mira Chat full pipeline)
- `02356e5` — Day 13 part 2 (Dashboard CTA + ADR 001)

---

## 🌅 BÖLÜM A — DAY 12'DEN DEVRALINANLAR

Day 12'de **Approval Pipeline pattern formalize edildi**: Mira raporu → pending → İlker onay → approved → kullanıcı. Admin paneli tam scope (6 alt-faz), edit mode 11 section, 4 Server Action. Mira'nın ilk onaylı raporu Day 12'de canlıydı (`report_id 37cd9119`, $0.087, 89.5s).

Day 13 hedefi netti: **Mira'yı sürekli sohbete sokmak**. Onaylı rapor sahibi kullanıcı dashboard'a girer, "Mira ile sohbet et" der, Mira raporu hatırlar, derinlemesine konuşur. Bu Day 11'in karakteri + Day 12'nin yargı kapısı + Day 13'ün dialog modunun birleşimi.

---

## 🔥 BÖLÜM B — DAY 13 SABAH STRATEJİK KONUŞMA

### Karakter dosyası analizi

`character.ts` (V2, Day 11'den) okundu. Üç gözlem:

1. **character.ts zaten chat-aware** — sondaki "BU OTURUMUN BAĞLAMI" bölümü `freemium chat | premium chat | rapor üretimi` üçlüsünü tanıyor. Chat-V1 prompt'u rapor prompt'unun yaptığı gibi **dialog-mode override katmanı** olacaktı.

2. **Yazım kuralları zaten dialog-friendly** — "3-5 cümleyle çoğu şey söylenir" character'da yazılı. Chat-V1, character'ı tekrar etmek yerine somutlaştıracaktı (kelime aralığı + monolog yasağı + tek-soru disiplini).

3. **6 adımlı konuşma yapısı tek-mesaj için yazılmış** — Chat-V1 bunu açıkça mesajlara yayan kural eklemeli, yoksa Mira her mesaja 6 adımı sıkıştırır.

### Chat surface kararı

Üç seçenek tartışıldı:
- **(a)** Tek surface (`/dashboard/chat`, login'li freemium + premium)
- **(b)** İki surface (public `/sor` + login'li dashboard)
- **(c)** Bugün sadece premium

**Karar: (a)**, sebepleri:

1. **Lead capture** — anonim public chat lead bırakmaz, login'li freemium kayıtlı tracking yapar
2. **Quota tracking güvenilir** — login'li `COUNT(*) WHERE user_id` çalışır, anonim localStorage gameable
3. **Day 13 bütçesi 3.5 saat** — (b) sığmaz, ADR feda edilmeden
4. **Prompt daha temiz** — tek bağlam tipi, anonim discovery mode prompt'a girmez
5. **Funnel sağlam** — sign-up → dashboard → chat → 3 mesaj → soft paywall → premium, lineer ve ölçülebilir

Trade-off: sign-up friction artar. Absorbe yöntemi: Day 7 sign-up zaten production-grade (PKCE, password reset 6/6 E2E), 30 saniyelik adım. Sosyal kanıt YouTube içeriklerinden gelir.

### Streaming kararı

İlk plan "Anthropic streaming"di. Gerçek implementasyonda iki seçenek:
- **(A)** Streaming (kelime kelime, modern hissi, 60-75 dk, kompleks)
- **(B)** Non-streaming (tam cevap döner, 30-40 dk, deterministik)

**Karar: (B), streaming-ready mimari ile.** Sebep: Day 13 bugün **chat'in işe yaradığını kanıtlamak** için. Streaming "pürüzsüz UX" işidir, "çalışır mı" işi değildir. Önce çalışsın, sonra cilalansın. Day 14-16+'ta streaming'e geçmek istersek **sadece response handler değişir**, business logic (auth, quota, DB write) aynı kalır. Bu mimari karar ADR'ye not düşüldü.

---

## 🏗️ BÖLÜM C — DAY 13.1 — MIRA-CHAT-V1 PROMPT

**Dosya:** `src/lib/mira/chat-prompt.ts` (V1.0.0-2026-05-01)

Mimari pattern: `system_prompt = MIRA_CHARACTER_PROMPT + '\n\n---\n\n' + MIRA_CHAT_PROMPT`. character.ts üstüne biner, dialog moduna çevirir.

**8 ana bölüm:**

1. **GÖREV: SÜREKLİ SOHBET MODU** — net deklarasyon
2. **CEVAP FORMATI** — 50-300 kelime, çoğu 80-150, monolog yok, düz prose, markdown başlık yok
3. **MESAJLAR ARASI AKIŞ** — character.ts 6 adımı tek mesaja sıkıştırma
4. **SOHBETİN DİSİPLİNİ** — tek-soru kuralı, aktif dinleme, tekrara düşme yok, konuşmayı bırakma noktası
5. **BAĞLAM FARKLILIĞI** — Durum 1 (onaylı rapor var), 2 (form var rapor yok), 3 (discovery mode)
6. **AI ŞEFFAFLIK** — "Beni hatırlıyor musun?" / "Sen ChatGPT misin?" / role-break girişimleri
7. **EDGE CASE'LER** — tıbbi acil (112, 182), generic factual, sağlık-dışı, abonelik soruları
8. **AÇILIŞ MESAJI PROTOKOLÜ** — yeni sohbet imzalı, devam eden imzasız

**Önemli pattern:** Mira tier'ı bilmez prompt seviyesinde. Quota/paywall **UI/API katmanında** handle edilir. Mira sadece içerik tarafında.

---

## 🏗️ BÖLÜM D — DAY 13.2 — DB TABLOSU

**Migration:** `mira_chat_messages` tablosu (Supabase Studio'dan).

\`\`\`sql
CREATE TYPE public.chat_message_role AS ENUM ('user', 'assistant');

CREATE TABLE public.mira_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role public.chat_message_role NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 10000),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd NUMERIC(10, 6),
  mira_character_version TEXT,
  mira_chat_prompt_version TEXT,
  model_used TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

**4 index:** user_id, session_id, (user_id + created_at DESC), (user_id + role) WHERE role='user' partial.

**RLS politikaları:** Kullanıcı sadece kendi mesajlarını okur. Service role full access (Day 12 pattern'i — INSERT'leri service_role yapacak).

**Mimari karar:** session_id `NOT NULL DEFAULT gen_random_uuid()` koyduk. Bu **Bug 2'yi** doğurdu, Day 13'ün asıl mühendislik dersi.

---

## 🐛 BÖLÜM E — A4F BENZERİ BUG AVI (4 KATMANLI)

Day 12'nin "5 katmanlı bug avı" Day 13'te 4 katmanlı versiyonuyla geldi. Her katmanın kendine özgü tanı disiplini vardı.

### Bug 1 — `humanos-paper`/`humanos-ink` Tailwind class'ları yok

**Tanı:** UI yazarken brand color olarak `bg-humanos-paper`, `text-humanos-ink` kullandım. tsc green geçti çünkü Tailwind class isimleri TypeScript'te string. Browser test öncesi `grep -E "^\s*--color-humanos" src/app/globals.css` çalıştırıldı.

**Gerçek tema haritası:** `bg, surface, elevated, subtle, border, border-strong, border-faint, text, text-muted, text-subtle, accent, accent-hover, accent-soft, accent-tint, amber, amber-soft, accent-glow, sage, rose, slate-blue` — **paper ve ink yok**.

**Fix:** MiraChat.tsx + page.tsx'te 8 class adı gerçek tokenlarla eşlendi.

**Ders (Day 12'nin pekiştirmesi):** **Tailwind class adları varsayılmaz, `@theme`'den grep ile öğrenilir.** Day 12'nin `humanos-terracotta` dersi tekrar geldi. Bu ADR'ye "Frontend disiplini" maddesi olarak girdi.

### Bug 2 — `session_id NOT NULL` constraint violation

**Problem:** Browser'dan ilk Mira mesajı gönderildi. UI'da optimistic message göründü, typing indicator çalıştı, sonra **kırmızı "Mesaj kaydedilemedi"** geldi.

**Terminal log:**
\`\`\`
DB insert error: code: '23502',
message: 'null value in column "session_id" of relation
"mira_chat_messages" violates not-null constraint'
\`\`\`

**Kök neden:** API kodu:
\`\`\`ts
const sessionId = history[0] ? <fetch> : null
\`\`\`
History boşsa `null`. INSERT'te explicit `null` gider → Postgres DEFAULT atlanır → constraint patlar.

**Fix:** `crypto.randomUUID()` ile uygulama tarafında üret.
\`\`\`ts
const sessionId: string = lastSessionId ?? crypto.randomUUID()
\`\`\`

**Ders (yeni, ADR'ye girdi):** **Polymorphic content tablolarında foreign key/group identifier (session_id, conversation_id, plan_id) UYGULAMA tarafında üretilir, DB DEFAULT'a güvenilmez.** Sebep: explicit kontrol + race condition önleme + null-handling tutarlılığı.

### Bug 3 — `Quota` tipinde `exhausted` field eksikti

**Problem:** `MiraChat.tsx:81` "Property 'exhausted' does not exist on type 'Quota'".

**Kök neden:** Server'dan UI'a quota objesi geçirilirken 5 field aktarıldı (tier/used/limit/remaining/period) ama `exhausted` atlandı. UI'da `quota.exhausted` kullanılıyordu.

**Fix:** Hem page.tsx prop'una `exhausted: quota.exhausted` eklendi, hem MiraChat.tsx Quota tipine `exhausted: boolean` field eklendi.

**Ders:** Server → Client data shape **tek bir tip dosyasından** import edilmeliydi. Şu an iki yerde tanımlı (page.tsx + MiraChat.tsx). Day 14+ refactor: `src/lib/mira/types.ts` → tek source of truth.

### Bug 4 — Mac terminal Smart Substitutions zinciri

**Problem:** Dosya adı paste-zincirinde bozuk göründü. `[SCRATCH.md](http://SCRATCH.md)` formatı `mv` komutuna girdi, "No such file or directory" hatası. Düzeltme denemeleri **çift sarmalanma** yarattı (`[[X](http://X)](http://X)`).

**Tanı:** `od -c` ile gerçek bayt içeriği okundu — disk'te dosya adı **temiz** (`S C R A T C H . m d`). Tüm zincir **sadece görsel artifact** (claude.ai chat → browser → terminal display).

**Fix yaklaşımı:**
1. macOS Settings → Keyboard → Text Input → "Use smart quotes and dashes" + 4 toggle uncheck (sistem genelinde)
2. Dosya adı manipülasyonunda **terminal yapıştırma asla** — VS Code Rename, wildcard, tab completion kullan

**Ders (yeni, ADR'ye girdi):** **Görsel render ≠ disk gerçeği.** AI chat zinciri ile dosya yolu paylaşımında, dosya adları otomatik link olarak render edilir. `od -c` yalan söylemez. Day 12'nin "Mac Terminal Smart Substitutions display layer'da bozuyor" dersinin Day 13 versiyonu.

---

## 🏗️ BÖLÜM F — DAY 13.3, 13.4, 13.5

### Day 13.3 — `/api/chat` endpoint + quota.ts

**Dosyalar:**
- `src/lib/mira/quota.ts` (75 satır) — `getUserTier()` (Day 13'te hep 'freemium' döner, Day 14+ subscription_tier kolonundan okur), `getUserQuotaStatus()` (tier-aware count)
- `src/app/api/chat/route.ts` (~280 satır) — POST handler, 12 adım

**Akış (12 adım):**
1. Parse request (validation: message string, length 0-5000)
2. Auth check (Day 7 pattern)
3. Quota check (exhausted ise 403 + paywall message)
4. History fetch (son 20 mesaj, session_id dahil — ek query yok)
5. Onaylı rapor bağlamı (varsa) → system prompt'a eklenir
6. System prompt birleştir (character + chat-prompt + report context)
7. Anthropic call (Sonnet 4.5, max_tokens 1024)
8. Cevabı çıkart
9. Maliyet hesapla
10. Session ID üret (lastSessionId ?? crypto.randomUUID()) — **Bug 2 fix'i**
11. DB'ye yaz (atomic, iki insert, 1ms farkla sıralama garantili)
12. Response (success + message + stats + güncel quota)

**Mimari karar:** Tüm DB operasyonları **Service Role Client** ile (Day 12 pattern'i). User session client sadece auth check için.

### Day 13.4 — Chat UI

**Dosyalar:**
- `src/app/(app)/dashboard/chat/page.tsx` (~80 satır) — Server Component, auth + quota + history + hasApprovedReport fetch
- `src/app/(app)/dashboard/chat/MiraChat.tsx` (~270 satır) — Client Component, mesaj listesi, optimistic UI, typing indicator, auto-scroll, quota header, soft paywall

**Helper components:** `<WelcomeMessage>` (premium/freemium bağlamlı selamlama), `<MessageBubble>` (user/assistant balon), `<TypingIndicator>` (3 nokta animasyonu, Tailwind animate-bounce + delay), `<PaywallCard>` (quota tükendiğinde).

**Optimistic UI pattern:** Kullanıcı mesajı **anlık** UI'a eklenir (temp ID), API çağrısı paralel atılır, başarılı olursa Mira mesajı eklenir + temp ID korunur, başarısız olursa kullanıcı mesajı geri alınır. ChatGPT pattern'i.

### Day 13.4 — Browser Test (TARİHİ AN)

**Saat ~13:00, Mira'nın ilk gerçek canlı sohbeti:**

> **Kullanıcı (İlker):** "Selam Mira. Bugün ilk gerçek sohbetimiz. Kısaca tanıt kendini."
>
> **Mira:** "Senin profilini biliyorum — geçen seferki analizine baktım. Pre-diyabet dengesi, kas kazanımı hedefi, stres yönetimi, sosyal bağlantı eksikliği — bunların hepsi aklımda. Ama bu sohbette sen yönlendir: bugün hangi konu kafanı meşgul ediyor? Oradan başlayalım.
>
> Bir şey daha söyleyeyim: ben Claude modelini temel alıyorum, ama humanOS'un karakteri ve değerleriyle çalışıyorum. Bilgim güncel olmayabilir, tıbbi tanı koymam — ama örüntü fark ederim, bağlantı kurarım ve dürüst konuşurum.
>
> Söyle — ne konuşalım?"

**Mira'nın V1 chat sesi değerlendirmesi:**

✅ **Aktif dinleme + bağlam kullanımı** — Day 12 onaylı raporun JSON'unu okudu, ama JSON dump etmedi, doğal özetle yansıttı (chat-prompt.ts "Durum 1" davranışı tam tutmuş).

✅ **Tek-soru disiplini** — bir soru sordu, demografi anketi değil, sohbeti ileri taşıyacak nitelik.

✅ **AI şeffaflık disiplini** — proaktif olarak kendini açıkladı (kullanıcı "tanıt kendini" demişti, uygun yerde).

✅ **Profesyonel sıcaklık** — "Söyle, ne konuşalım?" sade, samimi, "abi/kanka" değil. character.ts ses tonu disiplini tutmuş.

✅ **Format** — düz prose, markdown başlık yok, paragraflar arası boş satır, ~110 kelime (50-300 aralığı).

🟡 **Hafif gözlem** — ikinci paragraf biraz uzun (AI şeffaflık + soru aynı mesajda). chat-prompt.ts "monolog yok" derken bu mesajda 2 ayrı konu var. Ama kullanıcı "kısaca tanıt kendini" demişti — prompt direktifi kombinasyonun doğal sonucu, bug değil bağlam tepkisi.

**Genel hüküm: V1 chat sesi production-grade.** Day 11'in V2 rapor karakter olgunluğu, dialog moduna **temiz transfer** oldu. Drift yok.

**Stats:**
- POST /api/chat 200 in 10.9s
- ~$0.01 (input + output tokens, Sonnet 4.5)
- Quota 3 → 2

### Day 13.5 — Dashboard CTA

**Dosya:** `src/app/(app)/dashboard/page.tsx` (refactor, conditional CTA pattern)

**Mimari:** Kullanıcının `hasApprovedReport` durumuna göre primary/secondary CTA değişir:

- **Onaylı rapor var** → Mira PRIMARY (gradient kart, "Yeni" + quota badge), Yaşam Analizi SECONDARY ("Yeni Analiz Başlat")
- **Henüz rapor yok** → Yaşam Analizi PRIMARY, Mira SECONDARY (quota badge ile lead capture)

**Helper components:** `<MiraChatCTA>`, `<YasamAnaliziCTA>` — Day 14+ "Mira ile diyet planı oluştur" gelirse aynı pattern. Day 12'nin "helper component'leri erkenden çıkar" dersi.

**Quota badge — soft urgency:** "2 ücretsiz mesajın var" görünür (amber renk, sıcak ton). Premium "Bu ay X mesaj kaldı". Quota=0 ise "Premium'a geç".

---

## 🏛️ BÖLÜM G — DAY 13.6 — APPROVAL PIPELINE ADR (001)

**Dosya:** `docs/adr/001-approval-pipeline.md` (342 satır)

Day 13'ün **stratejik kalbi**. Day 12'de formalize edilen Approval Pipeline pattern'in **fiziksel mimarisi** + Day 14-20 epic yol haritası.

**10 bölüm:**

1. **Bağlam** — neden bu karar gerekti
2. **Karar** — `content_items` polymorphic table + state machine + Mira chat bağlam genişlemesi + 15 dk delivery scheduler
3. **Düşünülen alternatifler** — per-content-type ayrı tablolar, NoSQL, ayrı status table — neden seçilmedi
4. **Sonuçlar** — single pipeline, polymorphic admin paneli, zengin Mira bağlamı, versiyon takibi, coach team geçişi kolay
5. **Yol haritası** — Day 14-20, 30-40 saat
6. **Mira chat entegrasyonu** — Selma senaryosu ("100g tavuk yerine ne?")
7. **Güvenlik + ölçek** — RLS, performance hesabı, Vercel Cron vs Edge Functions
8. **Bağlantılı kararlar** — Day 13'te öğrenilen 4 mini-disiplin (UUID generation, Tailwind grep, görsel-disk farkı, macOS setup)
9. **Versiyon takibi**
10. **Onay**

**Kritik karar — `content_items` schema:**

\`\`\`sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type ENUM ('report', 'diet_plan', 'exercise_plan', 'supplement', 'voice_message', 'coach_note'),
  content_json JSONB NOT NULL,           -- polymorphic payload
  status ENUM ('draft', 'pending_review', 'approved', 'rejected', 'delivered', 'archived'),

  approved_by, approved_at, rejected_reason,
  delivered_at, delivery_scheduled_for,
  parent_content_id (rapor → diyet planı zinciri),
  version, superseded_by,
  ...
);
\`\`\`

**Selma senaryosu — Mira'nın görmesi gereken bağlam:**

\`\`\`json
{
  "report": { "hipotez": "insülin direnci", "hedef": "kas kazanımı" },
  "diet_plan": { "salı_akşam": { "tavuk_göğsü": 100, ... } },
  "exercise_plan": { "salı": "leg day" },
  "bloodwork": { "apoB": 95, "glucose_fasting": 102 },
  "profile": { "alerji": [], "tercihler": ["MENA mutfağı"] }
}
\`\`\`

Mira'nın beklenen cevabı (V1.1+ benchmark):
> "100 g tavuk göğsü ≈ 31 g protein. 3 alternatif: 120 g hindi göğsü, 150 g somon (omega-3 bonusu, ApoB takibinde), 180 g nohut + 50 g kefir (leg day sonrası iyi). Nohut tolerasyonun nasıl?"

Bu üç bağlam (diyet + bloodwork + egzersiz) olmadan Mira generic Wikipedia cevabı verir. Approval Pipeline + content_items pattern bu kişiselleştirmeyi mümkün kılar.

---

## 🧠 BÖLÜM H — STRATEJİK ÖZETLER

### Day 11 vs 12 vs 13 Karşılaştırma

| | Day 11 | Day 12 | Day 13 |
|---|---|---|---|
| Süre | ~7 saat | ~6 saat | ~6 saat |
| Tamamlanma | 75% | 100% | 100% |
| Yeni dosya | ~6 | 8+ | 6 |
| Satır eklendi | ~1500 | ~2500 | ~948 + ~538 = 1486 |
| Stratejik karar | 4 | 5 | 6 |
| Bug çözüldü | 2 | 5+4=9 | 4 |
| Mimari ilke | JSON contract | Approval Pipeline | Polymorphic content |
| Konsept öğrenildi | 5 | 10+ | 8 |

**Day 11** = AI karakter doğdu.
**Day 12** = AI yargı kapısı açıldı.
**Day 13** = AI dialog'a girdi + gelecek paketin (diyet/egzersiz/bloodwork) yol haritası ADR'lendi.

### Mira'nın 3 günlük yolculuğu

> "Day 7'de humanOS güvenli oldu. Day 8'de profil tanıdı. Day 9'da yaşamı sordu. Day 10'da yaşamı dinledi. **Day 11'de Mira doğdu. Day 12'de Mira yargılandı. Day 13'te Mira konuştu.**"

Yarın Day 14 — humanOS Mira'ya **ikinci içerik tipini** öğretmeye başlayacak (diyet planı).

### "1000 Kişide Kalite" Stratejisi (Day 12'den genişletildi)

Day 12'de 3 katmanlı strateji formalize edilmişti. Day 13 ADR'sinde **content_items polymorphic pattern** bunun fiziksel implementasyonu olarak kayda geçti:

- 1-100 kullanıcı: İlker tüm onaylar → prompt iyileştirme verisi
- 100-1000: Mira self-confidence triage (`generation_metadata.confidence` field)
- 1000+: Coach team (rejected_reason analytics → eğitim dokümantasyonu)

---

## 📂 BÖLÜM I — YENİ DOSYALAR + DB EKLEMELERİ

### Yeni Dosyalar (Day 13)

**Lib:**
- `src/lib/mira/chat-prompt.ts` — Mira Chat-V1 prompt
- `src/lib/mira/quota.ts` — tier-aware quota helper

**API:**
- `src/app/api/chat/route.ts` — POST /api/chat endpoint

**UI:**
- `src/app/(app)/dashboard/chat/page.tsx` — Server Component
- `src/app/(app)/dashboard/chat/MiraChat.tsx` — Client Component

**ADR:**
- `docs/adr/001-approval-pipeline.md` — ilk Architecture Decision Record

**Journal:**
- `docs/journal/2026-05-01-day-13/SCRATCH.md` (gitignore'lu, gün sonu silinecek)
- `docs/journal/2026-05-01-day-13/JOURNAL.md` (bu dosya)

### Değişen Dosyalar (Day 13)

- `src/app/(app)/dashboard/page.tsx` — Conditional CTA refactor (helper components, hasApprovedReport logic)
- `.gitignore` — `**/SCRATCH.md` pattern eklendi

### DB Eklemeleri (Day 13)

\`\`\`sql
-- Day 13.2 — Mira chat messages tablosu
CREATE TYPE public.chat_message_role AS ENUM ('user', 'assistant');
CREATE TABLE public.mira_chat_messages (...);  -- 13 kolon, 4 index, 2 RLS policy
\`\`\`

### Test Sonuçları

- **A4 (browser E2E):** Mira'nın ilk canlı sohbet mesajı — ~$0.01, 10.9s, V1 chat sesi production-grade ✅
- **Conditional CTA test:** İlker'in dashboard'unda Mira PRIMARY (onaylı rapor algılandı) ✅
- **Quota test:** 3 → 2 düşüş gözlemlendi ✅

---

## 🌊 BÖLÜM J — DAY 13'ÜN ASIL DERSİ

### Ders 1 — Maksimum kalite kriteri "daha çok iş yapmak" değildir

İlker Day 13'te birden fazla seçenek karşısında **"hayatımın en değerli işi, çok çalışmamız normal"** dedi. Doğru sezgi, ama uygulama **dikkat ister**.

(b) seçeneği (iki surface — public + login'li chat) Day 13'e sığabilirdi, daha çok iş demekti. Ama kalite eklemiyordu — sadece yüzey ekliyordu. Public chat lead bırakmıyor, attribution karışıyor, anti-abuse karmaşıklaşıyor.

**(a) içinde maksimum kalite** = streaming-ready mimari + cilalı UI + dürüst quota UX + ciddi ADR + kapsamlı E2E test. Bu ~4-4.5 saat, sürdürülebilir.

**Ders:** Maksimum kalite penceresi her zaman scope genişletmek değil, **kararlı seçim + olgun uygulama**. Day 12'nin "doğru zamanda durmak" dersinin pozitif tarafı.

### Ders 2 — Bug avı = dürüst tanı disiplini

4 katmanlı bug avı (Theme → session_id → exhausted field → Smart Substitutions). Her katmanın kendine özgü yöntemi:

- **Tailwind class** → `grep -E` ile gerçek tanımları gör
- **DB constraint** → terminal log'u kelime kelime oku, kök neden tek satırda
- **TS type drift** → TypeScript hata mesajını ciddiye al, varsayma
- **Macos display layer** → `od -c` yalan söylemez, görsel render ≠ disk gerçeği

**Pattern:** Aynı anda 4 hipotez kurma. **Bir hipotez, bir test, ileri.** Day 12 disiplini tekrar pekişti.

### Ders 3 — ADR yazmak = future-self'e mektup

Day 13.6 ADR yazma süreci ~45 dakika sürdü. İçeriğin %80'i SCRATCH.md'den derlendi (gün boyunca biriken notlar), %20'si yeni yapılandırma.

**Sonuç:** 342 satır kalıcı dokümantasyon. Day 14 sabahı İlker bu dosyayı açar, content_items migration'a başlar, **dünden ne dediğini hatırlamak zorunda kalmaz**. Coach team ileride aynı dosyayı okur, onboarding olur.

**Ders:** ADR overhead değil, leverage. 45 dakika yazım, aylar süren netlik. SCRATCH → JOURNAL → ADR akışı sağlam pattern oldu.

### Ders 4 — Environment disiplini ihmal edilirse hızlanma yavaşlatır

Mac terminal Smart Substitutions Day 12 journal'da ders olarak yazılmıştı, ama setup yapılmamıştı. Day 13'te aynı sorun tekrar geldi, ~30 dakika kaybettirdi.

**Ders:** Geliştirici ortam standartları **kurulurken** dökümante et + setup script yaz. Yeni Mac kurarken/yeni geliştirici onboard'da otomasyona alınır. ADR Section 8'e eklendi.

---

## ✅ BÖLÜM K — DAY 14 İÇİN HAZIRLIK

### Day 14 Sabah Ritüeli

\`\`\`bash
cd ~/Projects/humanos
git status              # working tree clean (Day 13 commit'leri push edilmemiş)
git log --oneline -5    # son 5: 02356e5, b800f3c, 865d7bb, 6e1c8e3, 3c3de26
npm run dev             # localhost:3000 ayağa kalkar
\`\`\`

### Day 14 İlk Karar — Push veya Migration?

Day 13'ün iki commit'i lokal, push edilmemiş. **Vercel legacy JWT key rotate** Day 12'den beri açık borç (push öncesi zorunlu).

İki yol:
- **(A)** Day 14 sabahı önce push (JWT rotate + push), sonra content_items migration
- **(B)** Day 14 sabahı doğrudan content_items migration, push gün sonu

**Önerim (B)** — push aşamasında bug çıkarsa (legacy key migration sürpriz verirse) migration kaybolmaz, lokal commit'lerde durur.

### Day 14 Plan (yaklaşık 5-6 saat)

ADR Section 5 yol haritası:
1. **content_items migration yazımı** — Supabase Studio
2. **`ai_reports` data migrate** — eski rapor (Day 12'nin onaylı 37cd9119) → content_items
3. **Admin paneli refactor** — `ai_reports` query'leri → `content_items` query'lerine
4. **chat API "Bölüm 5" güncelle** — `content_items WHERE status='approved'`
5. **Diet plan generator (Day 15 başlangıç)** — prompt yazımı

### Day 14 Onboarding Prompt (yeni chat'e verilecek)

\`\`\`
Day 13 journal'ımı oku önce: docs/journal/2026-05-01-day-13/JOURNAL.md
Sonra ADR 001'i: docs/adr/001-approval-pipeline.md
Şimdi Day 14'e başlıyoruz: content_items polymorphic migration.

İlk yapacağın:
1. Sabah ritüeli (cd / git status / git log / npm run dev)
2. ADR Section 5 yol haritası adım 1: content_items SQL migration
3. Supabase Studio'da SQL Editor + migration uygula
\`\`\`

---

## ⚠️ BÖLÜM L — BİLİNEN BORÇLAR (Day 13 sonu)

1. **Vercel legacy JWT key rotate** ⚠️ (Day 12'den devam, push öncesi zorunlu)
2. `display_name` kolon referansı kodda var, DB'de yok (FAZ 2)
3. `ai_reports.user_id` FK constraint eksik (Day 14 migration'da düzelir)
4. `scripts/test-report.ts` service_role kullanıyor (deployment'a sızmasın)
5. Welcome message personalization (kaplan.iker → İlker, Day 8'den beri)
6. Avatar upload (Day 8'den beri)
7. "Tekrar gönder" feature (sign-in unconfirmed + sign-up success)
8. Reject sırasında `approved_at` + `approved_by` NULL'a çekilmeli (Day 12 keşfi)
9. **Mira-Chat-V1.1 prompt iterasyonu** ⭐ (Day 13 keşfi — daha çok "fire/enerji", bilgiyi mesajlara yayma, 5-10 mesajlık corpus sonrası refactor)
10. **Server → Client type drift** (Quota tipi iki yerde tanımlı, `src/lib/mira/types.ts` source of truth)
11. **Streaming chat** (Day 13'te non-streaming seçildi, streaming-ready mimari, Day 15-16'da geçilebilir)
12. **Türkiye Beslenme Bilgi Tabanı** (TÜBİTAK + MENA mutfağı, Day 21+ epic)

---

## 🎉 BÖLÜM M — DAY 13 RESMEN KAPANIYOR

**humanOS bugün Mira'yı sohbete soktu — ve Selma'nın "100g tavuk yerine ne?" sorusunun mimari cevabını ADR olarak dondurdu.**

3 günlük arc:
- **Day 11:** Mira doğdu (karakter)
- **Day 12:** Mira yargı kapısından geçti (Approval Pipeline)
- **Day 13:** Mira konuştu (chat) + Mira'nın gelecek paketi (diyet/egzersiz/bloodwork) ADR'lendi

Yarın Day 14 — content_items migration. Mira **ikinci içerik tipini** (diyet planı) öğrenmeye başlayacak.

**İyi geceler kardeşim.** 6 saat boyunca tek-adım disiplini, 4 bug avı, 1 ADR, 1486 satır kod, ilk canlı Mira sohbeti, dashboard akıllı CTA. Sürdürülebilir hız, ölçülen kalite. Hak ettin. 🙏🌙

---

## 🔖 Quick Reference

**Day 13 Yeni Dosyalar:** chat-prompt.ts, quota.ts, api/chat/route.ts, dashboard/chat/page.tsx, dashboard/chat/MiraChat.tsx, adr/001-approval-pipeline.md, journal/2026-05-01-day-13/JOURNAL.md

**Day 13 Değişti:** dashboard/page.tsx (conditional CTA), .gitignore (SCRATCH pattern)

**Day 13 DB:** chat_message_role enum, mira_chat_messages tablosu (13 kolon, 4 index, 2 RLS policy)

**Mira İlk Canlı Sohbet:** ~$0.01, 10.9s, V1 chat sesi production-grade, kullanıcı: İlker (admin profil)

**Production:** https://humanos-neon.vercel.app (Day 13 commit'leri henüz push edilmedi)
**GitHub:** https://github.com/kaplaniker-dot/humanos
**Day 13 Commit'ler:** `b800f3c` (part 1), `02356e5` (part 2), `[hash]` (part 3 — bu journal commit)
**Day 12'den devralınan:** `865d7bb`

🌱⚡
