# Day 11 — Mira AI Karakter Sistemi & Premium Rapor Pipeline'ı

**Tarih:** 29 Nisan 2026
**Durum:** %75 tamamlandı — kalan %25 Day 12 sabahına devredildi
**Süre:** Sabah 09:00 başladı, akşam dış işler nedeniyle erken kapanış

---

## 🎯 Bu günün hedefi

humanOS'a AI rapor üretim sistemini eklemek:
- Mira karakteri inşası (humanOS'un AI sesi)
- Anthropic API entegrasyonu
- Premium rapor üretim pipeline'ı
- Admin onay sistemi (rapor kalite kontrolü)
- Premium dashboard chat UI temeli

---

## ✅ Bugün tamamlananlar

### 1. Stratejik kararlar (sabah, ~2 saat)

**3-Tier Business Model netleşti:**
- **Freemium:** Form yok. 3 soruluk Mira chatbot. Anonim. Premium çağrısı doğal.
- **Premium Self:** 32 soruluk form + AI rapor (800-1200 kelime) + sürekli chat (200 mesaj/ay quota).
- **Premium Coaching:** Aynı + İlker rapor onayı + Calendly randevusu + insan müdahale.

**AI Reliability Stratejisi — 5 katmanlı:**
1. Veri katmanı (deterministik kod)
2. Şablon katmanı (yarı-deterministik)
3. AI içgörü katmanı (LLM)
4. Validation katmanı (yasak kelimeler, uzunluk, tıbbi sınır)
5. İlker onay katmanı (Day 11-30 her rapor; sonra threshold)

**Continuous improvement loop:**
Her İlker düzeltmesi → log → haftalık prompt update → eval suite → deploy. Hedef: onay oranı 100% → 20% (Day 90).

### 2. Mira karakteri (sabah, ~2 saat)

**İsim seçimi:** "Mira" — Sanskritçe "deniz/ışık", İbranice "ayna", Latince "miracle". Gender-neutral, yaşa adaptif (20-29 / 30-44 / 45+).

**V1 → V2 iterasyonu:**
- V1 çok agresif/casual ("Sen zaten orada değilsin", "recovery sufficient stimulus stale")
- V2: Profesyonel + sıcak + eğitici. Bir doktor + beslenme uzmanı arası. %100 akıcı Türkçe. İngilizce terimler parantez içinde Türkçe açıklamayla.

**11 yasaklı davranış prompt'ta sabit:**
Tıbbi tanı, ilaç önerisi, garanti vaadi, self-help klişeleri, casual familiarite ("abi/kanka"), duygu geçiştirme, sağlık-dışı uzman alanı, ChatGPT impersonation, AI inkârı, generic top-10 listesi, çıplak İngilizce terim.

**AI şeffaflık disiplini eklendi:**
- İmza: "— Mira" + italik "humanOS'un yapay zeka tabanlı sesi"
- Disclaimer: "Bu rapor humanOS'un yapay zeka tabanlı analiz aracı Mira tarafından oluşturulmuştur..."

### 3. Kod implementasyonu

**Yeni dosyalar:**
- `src/lib/mira/character.ts` (163 satır) — Mira karakter prompt'u v2.0.0
- `src/lib/mira/report-prompt.ts` (194 satır) — Premium rapor görev prompt'u v2.0.0
- `src/lib/mira/profile-builder.ts` (285 satır) — DB row → Türkçe prose dönüşümü
- `src/lib/mira/anthropic-client.ts` (95 satır) — Anthropic SDK wrapper, model config, health check
- `src/lib/mira/report-generator.ts` (189 satır) — Orchestrator: profile + character + prompt + API + parse
- `src/app/api/generate-report/route.ts` (211 satır) — POST endpoint, 8 katmanlı güvenlik
- `scripts/test-anthropic.ts` — API health check scripti
- `scripts/test-report.ts` (205 satır) — CLI'dan rapor üretim test scripti
- `src/types/supabase.ts` (392 satır) — Supabase TypeScript types (CLI üretti)

**Yeni paketler:**
- `@anthropic-ai/sdk@0.91.1` (Anthropic resmi SDK)
- `tsx@latest` (TypeScript script runner, dev dependency)
- `dotenv@latest` (env var loader for scripts, dev dependency)

**Yeni env vars:**
- `ANTHROPIC_API_KEY` (sk-ant-api03-... — Sonnet 4.6 + Haiku 4.5 erişimi)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side DB erişimi, RLS bypass)

**.gitignore güçlendirildi:**
- `.env.local`
- `.env*.local`
- `output/` (test rapor çıktıları)

### 4. DB tablosu — `ai_reports`

19 kolonlu yeni tablo (Supabase Studio'da SQL ile oluşturuldu):
- İlişkiler: user_id (FK auth.users), assessment_id (FK life_assessments)
- Status enum: pending_review / approved / rejected / delivered
- Versiyon takibi: mira_version, report_prompt_version
- İçerik: content_json (jsonb), raw_response (text)
- Maliyet: input_tokens, output_tokens, cost_usd, timing_ms
- Onay akışı: admin_notes, approved_by, approved_at, rejected_reason, delivered_at
- Idempotency: unique(assessment_id) constraint

3 RLS policy:
- Users can view own approved reports (SELECT)
- Service role full access (ALL)
- Users can insert own reports (INSERT)

4 index: user_id, status, created_at desc, pending_review (partial)

### 5. Test çıktıları

**A4b — `pingAnthropic()`:** ✅ Başarılı (1671ms, $0.0001)

**A4c — Manuel rapor üretimi (CLI):**
- Assessment ID: `450c28e7-6b62-4765-b753-d04460ea51e8` (29 erkek, 180/81, akdeniz)
- Süre: 78720ms (1.3 dakika)
- Maliyet: $0.0842
- Token: 7631 input + 4089 output
- Çıktı: `output/report-2026-04-29T15-14-24.json` + `.md`
- **Kalite onayı: ✅ İlker beğendi** ("Raporun kıvamı gayet iyi")

### 6. Mira ile ilgili 2 sample rapor üretildi

**Manuel test (sabah, ben Mira'yı oynadım):**
1. **İlker (gerçek profili):** Pattern hipotezi "üretim mükemmel ama çıkış sistemi kapalı". YouTube video çıkış zorunluluğu, antrenman uyaran çeşitlemesi, sosyal medya zaman dilimleme.
2. **Ayşe (hayali çalışan anne):** Pattern hipotezi "enerji üretiyorsun ama yenilenme alanı bırakmıyorsun". Uyku 6→7, sabah 20dk kendin için, 30 saniye duraksama pratiği.

**Gerçek API test (öğleden sonra, Sonnet 4.6 üretti):**
- 450c28e7 assessment (29 erkek, akdeniz) için tam rapor.
- V2 prompt'larla tutarlı Mira sesi.
- Şeffaflık disiplini (Mira imzası + AI disclaimer) çalışıyor.

---

## ⏸️ Bugün kalan / yarına devredildi

### A4f — End-to-end browser testi (yarın ilk iş, ~15 dk)

Production akış testi:
- Dev server: `npm run dev`
- Browser: `localhost:3000` → login
- DevTools console:
```javascript
  fetch('/api/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessment_id: '450c28e7-6b62-4765-b753-d04460ea51e8'
    })
  }).then(r => r.json()).then(console.log)
```
- Beklenen: success: true, report_id, stats
- Sonra Supabase Studio'da `ai_reports` tablosunda satır görmeli

### A5 — Admin panel (~2-3 saat)

Rapor onay sistemi:
- Yeni route: `/admin/reports`
- Yetki kontrolü: sadece İlker (özel role veya hardcoded user_id)
- Liste: pending_review raporlar (en yeni başta)
- Detay sayfası: rapor full görünüm + edit + onay/red butonları
- Onay → status='approved', delivered_at boş; ileride email tetikler
- Red → status='rejected', rejected_reason zorunlu

### A6 — Premium dashboard chat UI (~1.5 saat)

Sürekli chat panel:
- Yeni component: `<MiraChat>` premium dashboard'da
- Mesaj listesi (kullanıcı + Mira)
- Input + send butonu
- API endpoint: `/api/chat` (yeni — A6'da yazılacak)
- Mira chat prompt: yeni `src/lib/mira/chat-prompt.ts` (V2 character üstüne biner)
- Quota: 200 mesaj/ay (kullanıcı bazlı sayaç)
- DB: yeni tablo `mira_chat_messages` (user_id, role, content, created_at)

### A7 — Freemium 3-soru chatbot (~45 dk, opsiyonel Day 12'ye)

`/sor` veya `/chat` public sayfası:
- Login gerekmez
- 3 soru limiti (browser localStorage veya session)
- Mira haiku-4.5 modeli (ucuz)
- Premium upsell footer'da

### A8 — Day 11 final commit + journal kapanış (~30 dk)

- `git add` + `commit` mesajı: "Day 11: Mira AI karakter + Premium rapor pipeline (75% complete)"
- Journal'i bu noktaya kadar olan haliyle commit
- Day 11 kapanış paragrafı eklenecek

---

## 📚 Day 11+ master plan'a eklenmesi gereken — gelecek özellikler

### Premium Self — yeni yetenekler (Hafta 2-3)

1. **Diyet planı oluşturma** — Mira mod: nutrition-plan
   - Profil + form + (varsa) kan tahlili → kişisel diyet
   - **Türkiye Beslenme Rehberi** (TÜBİTAK / Sağlık Bakanlığı) ile eğitilmiş AI
   - Yerel besinler (Türk mutfağı + MENA)

2. **Egzersiz planı oluşturma** — Mira mod: exercise-plan
   - Profil + sakatlıklar + ekipman + (varsa) kan tahlili → antrenman programı
   - Salon / ev / minimal ekipman varyantları

3. **Kan tahlili sistemi** — yeni epic
   - Upload (PDF/görsel)
   - Parse (Anthropic vision API + marker eşleştirme)
   - Standardize (humanOS marker dictionary: ~40-60 marker)
   - **Tüm Mira önerilerine entegrasyon** (rapor + diyet + egzersiz + chat)
   - Kan değerine göre takviye önerileri (tıbbi sınır içinde)

### Premium Coaching workflow

1. AI analiz akışı (rapor + form + chat)
2. Kullanıcı kan tahlili yükler
3. Calendly randevusu oluşturur
4. **İlker'in admin paneline** otomatik düşer:
   - Full kullanıcı paketi tek ekranda
5. İlker randevuda derin müdahale yapar (insan koçluk)

### Mira Mod Sistemi (mimari evrim)### AI Eğitim — Beslenme Bilgi Tabanı

- Türkiye Beslenme Rehberi kaynakları
- Yerel besin kompozisyonu
- MENA mutfağı entegrasyonu
- Yaygın durumlar için modüller (insülin direnci, hashimoto vs)

---

## 🐛 Bilinen bug'lar / borçlar

1. **Day 10 form completion bug:**
   Form 4 boyutta tamamlanıyor ama `status` 'completed'a güncellenmiyor — manuel UPDATE gerekti. `src/lib/assessment/actions.ts` içinde `completeAssessment` fonksiyonu kontrolü gerek. Day 12'de çöz.

2. **Test scripti `service_role` key ile çalışıyor:**
   `scripts/test-report.ts` RLS bypass için service_role kullanıyor. Production-safe (terminal'den çalışıyor) ama deployment'a girmemeli. Şu an girmiyor (scripts dizini build'a girmiyor).

3. **`src/lib/mira/context-builder.ts` silindi:**
   Boş kalmıştı, kullanılmıyordu. İhtiyaç olunca yeniden oluştururuz.

4. **TypeScript types — gen-types deprecated parameters:**
   Supabase CLI 2.95.4'te bazı warning'ler var. Şu an çalışıyor, ileride güncelleme gerekebilir.

---

## 📊 Bugün üretilen değer

**Kod satırı:** ~1340 yeni satır
**Yeni dosya:** 9
**Yeni tablo:** 1 (ai_reports, 19 kolon, 3 policy, 4 index)
**Yeni paket:** 3 (@anthropic-ai/sdk, tsx, dotenv)
**Maliyet — bugünkü API:** ~$0.20 (3 test üretim)
**Mira karakter olgunluğu:** V2 (production-ready prompt)

---

## 🎯 Yarın sabah ilk 30 dakika için

```bash
cd ~/Projects/humanos
git status
git log --oneline -5
npm run dev
# (browser localhost:3000 login)
# (DevTools console fetch komutu — A4f testi)
```

Eğer A4f testi ✅ → A5 (admin panel) başla
Eğer hata → tanı + çöz, sonra A5

**A4f → A5 → A6 → A7 → A8** sırasıyla. Tahmini 6-7 saat. Day 11 yarın akşam 19:00 civarı kapanır.

---

*Son güncelleme: 29 Nisan 2026, akşam erken kapanış*
*Mira v2.0.0-2026-04-29 — humanOS'un yapay zeka tabanlı sesi*
