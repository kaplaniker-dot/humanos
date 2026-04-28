// src/lib/assessment/questions.ts
// humanOS — Comprehensive Life Analysis (Free Tier MVP)
// 4 dimension × 8 question = 32 questions
// Day 10 — Conversation Mode rewrite
// DB schema uyumlu: nutrition_primary_diet, habits_smoking_status, habits_alcohol_frequency

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export type Dimension = 'nutrition' | 'exercise' | 'blood' | 'habits'

export type DbTarget =
  | { kind: 'structured'; column: string }
  | { kind: 'jsonb'; column: string; key: string }

type BaseQuestion = {
  id: string
  label: string
  help?: string
  required: boolean
  db: DbTarget
}

export type SingleSelectQuestion = BaseQuestion & {
  type: 'single_select'
  options: { value: string; label: string }[]
}

export type MultiSelectQuestion = BaseQuestion & {
  type: 'multi_select'
  options: { value: string; label: string }[]
  allowOther?: boolean
}

export type SliderQuestion = BaseQuestion & {
  type: 'slider'
  min: number
  max: number
  step: number
  unit?: string
  minLabel?: string
  maxLabel?: string
}

export type NumberQuestion = BaseQuestion & {
  type: 'number'
  min?: number
  max?: number
  unit?: string
}

export type DateQuestion = BaseQuestion & {
  type: 'date'
}

export type TextareaQuestion = BaseQuestion & {
  type: 'textarea'
  placeholder?: string
  maxLength?: number
}

export type NumberGroupQuestion = BaseQuestion & {
  type: 'number_group'
  fields: {
    id: string
    label: string
    min?: number
    max?: number
    unit?: string
    db: DbTarget
  }[]
}

export type PairedSelectQuestion = BaseQuestion & {
  type: 'paired_select'
  options: { value: string; label: string }[]
  primaryLabel: string
  secondaryLabel: string
  secondaryDb: DbTarget
  secondaryOptional: boolean
}

export type Question =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | SliderQuestion
  | NumberQuestion
  | DateQuestion
  | TextareaQuestion
  | NumberGroupQuestion
  | PairedSelectQuestion

export type QuestionAnswer =
  | string
  | number
  | string[]
  | { primary: string; secondary: string | null }
  | Record<string, number | null>
  | null

// ═══════════════════════════════════════════════════
// DIMENSION 1 — NUTRITION (Beslenme)
// ═══════════════════════════════════════════════════

const nutritionQuestions: Question[] = [
  {
    id: 'gender',
    type: 'single_select',
    label: 'Cinsiyet',
    help: 'Kalori ve makro hesaplaması için.',
    required: true,
    options: [
      { value: 'kadin', label: 'Kadın' },
      { value: 'erkek', label: 'Erkek' },
      { value: 'belirtmek_istemiyorum', label: 'Belirtmek istemiyorum' },
    ],
    db: { kind: 'structured', column: 'gender' },
  },
  {
    id: 'body_basics',
    type: 'number_group',
    label: 'Yaş, boy ve kilon',
    help: 'Bu üç değer planının temelini oluşturuyor.',
    required: true,
    fields: [
      {
        id: 'age',
        label: 'Yaş',
        min: 14,
        max: 100,
        unit: 'yıl',
        db: { kind: 'structured', column: 'age' },
      },
      {
        id: 'height',
        label: 'Boy',
        min: 120,
        max: 220,
        unit: 'cm',
        db: { kind: 'structured', column: 'height_cm' },
      },
      {
        id: 'weight',
        label: 'Kilo',
        min: 35,
        max: 250,
        unit: 'kg',
        db: { kind: 'structured', column: 'weight_kg' },
      },
    ],
    db: { kind: 'jsonb', column: 'nutrition_details', key: 'body_basics' },
  },
  {
    id: 'nutrition_goal',
    type: 'paired_select',
    label: 'Beslenme hedeflerin?',
    help: 'Birden fazla hedef varsa ikincisini de seç.',
    required: true,
    primaryLabel: 'Birincil hedef',
    secondaryLabel: 'İkincil hedef (opsiyonel)',
    secondaryOptional: true,
    options: [
      { value: 'yag_kaybi', label: 'Yağ kaybı + form alma' },
      { value: 'kas_kazanimi', label: 'Kas kazanımı' },
      { value: 'performans', label: 'Performans' },
      { value: 'saglik_uzun_omur', label: 'Sağlık & uzun ömür' },
      { value: 'sindirim_enerji', label: 'Sindirim / enerji' },
      { value: 'hastalik_yonetimi', label: 'Hastalık yönetimi' },
    ],
    db: { kind: 'jsonb', column: 'nutrition_details', key: 'primary_goal' },
    secondaryDb: {
      kind: 'jsonb',
      column: 'nutrition_details',
      key: 'secondary_goal',
    },
  },
  {
    id: 'chronic_conditions',
    type: 'multi_select',
    label: 'Tanı konmuş kronik hastalıkların?',
    help: 'Birden fazla seçebilirsin. Yoksa "Yok" seç.',
    required: true,
    allowOther: true,
    options: [
      { value: 'yok', label: 'Yok' },
      { value: 'diyabet', label: 'Diyabet (Tip 1 / 2)' },
      { value: 'pre_diyabet', label: 'Pre-diyabet / insülin direnci' },
      { value: 'hipotiroidi', label: 'Hipotiroidi' },
      { value: 'hashimoto', label: 'Hashimoto' },
      { value: 'hipertansiyon', label: 'Hipertansiyon' },
      { value: 'kolesterol', label: 'Yüksek kolesterol' },
      { value: 'pcos', label: 'PCOS' },
      { value: 'celiac', label: 'Çölyak' },
      { value: 'ibs_ibd', label: 'IBS / IBD' },
      { value: 'reflu', label: 'GERD / Reflü' },
      { value: 'yagli_karaciger', label: 'Yağlı karaciğer' },
    ],
    db: {
      kind: 'jsonb',
      column: 'nutrition_details',
      key: 'chronic_conditions',
    },
  },
  {
    id: 'food_allergies',
    type: 'multi_select',
    label: 'Gıda alerjin veya intoleransın?',
    help: 'Birden fazla seçebilirsin.',
    required: true,
    allowOther: true,
    options: [
      { value: 'yok', label: 'Yok' },
      { value: 'sut_laktoz', label: 'Süt / laktoz' },
      { value: 'gluten', label: 'Gluten' },
      { value: 'yumurta', label: 'Yumurta' },
      { value: 'fistik_kuruyemis', label: 'Fıstık / kuruyemiş' },
      { value: 'deniz_urunleri', label: 'Deniz ürünleri' },
      { value: 'soya', label: 'Soya' },
      { value: 'fodmap', label: 'FODMAP' },
      { value: 'histamin', label: 'Histamin' },
    ],
    db: {
      kind: 'jsonb',
      column: 'nutrition_details',
      key: 'food_allergies',
    },
  },
  {
    id: 'current_diet_style',
    type: 'single_select',
    label: 'Şu anki beslenme tarzın?',
    help: 'En çok kendine yakın hissettiğini seç.',
    required: true,
    options: [
      { value: 'standart', label: 'Standart (omnivor)' },
      { value: 'akdeniz', label: 'Akdeniz' },
      { value: 'dusuk_karb', label: 'Düşük karbonhidrat' },
      { value: 'keto', label: 'Ketojenik' },
      { value: 'aralikli_oruc', label: 'Aralıklı oruç' },
      { value: 'vejetaryen', label: 'Vejetaryen' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'pesketaryen', label: 'Pesketaryen' },
      { value: 'karnivor', label: 'Karnivor' },
      { value: 'karisik', label: 'Hiçbiri / karışık' },
    ],
    db: { kind: 'structured', column: 'nutrition_primary_diet' },
  },
  {
    id: 'energy_level',
    type: 'slider',
    label: 'Günlük ortalama enerji seviyen?',
    help: 'Beslenmenin biyolojik yansıması.',
    required: true,
    min: 1,
    max: 10,
    step: 1,
    minLabel: 'Tükenmişim',
    maxLabel: 'Pik form',
    db: { kind: 'jsonb', column: 'nutrition_details', key: 'energy_level' },
  },
  {
    id: 'food_relationship',
    type: 'single_select',
    label: 'Yiyecekle ilişkin nasıl?',
    help: 'Yargılamadan, dürüst — en yakın olanı seç.',
    required: true,
    options: [
      { value: 'saglikli', label: 'Sağlıklı — keyif alıyorum, suçluluk yok' },
      { value: 'kontrolcu', label: 'Kontrolcü — sürekli sayıyorum, gerginim' },
      { value: 'duygusal', label: 'Duygusal — stres ve duygularla yiyorum' },
      { value: 'kayitsiz', label: 'Kayıtsız — yemeği önemsemiyorum' },
      { value: 'karmasik', label: 'Karmaşık — değişiyor, bazen iyi bazen kötü' },
    ],
    db: {
      kind: 'jsonb',
      column: 'nutrition_details',
      key: 'food_relationship',
    },
  },
]

// ═══════════════════════════════════════════════════
// DIMENSION 2 — EXERCISE (Egzersiz)
// ═══════════════════════════════════════════════════

const exerciseQuestions: Question[] = [
  {
    id: 'activity_level',
    type: 'single_select',
    label: 'Şu anki aktivite seviyen?',
    required: true,
    options: [
      { value: 'sedanter', label: 'Çok az hareketli (masa başı)' },
      { value: 'hafif', label: 'Hafif aktif (haftada 1-2)' },
      { value: 'orta', label: 'Orta aktif (haftada 3-4)' },
      { value: 'yuksek', label: 'Yüksek aktif (haftada 5-6)' },
      { value: 'atlet', label: 'Profesyonel / atlet seviyesi' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'activity_level',
    },
  },
  {
    id: 'training_history',
    type: 'single_select',
    label: 'Toplam antrenman geçmişin?',
    help: 'Yaşam boyu, düzenli antrenman süren.',
    required: true,
    options: [
      { value: 'hic', label: 'Hiç düzenli yapmadım' },
      { value: '1_yil_alti', label: '1 yıldan az' },
      { value: '1_3_yil', label: '1-3 yıl' },
      { value: '3_5_yil', label: '3-5 yıl' },
      { value: '5_10_yil', label: '5-10 yıl' },
      { value: '10_yil_ustu', label: '10 yıl ve üzeri' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'training_history',
    },
  },
  {
    id: 'exercise_goal',
    type: 'paired_select',
    label: 'Egzersiz hedeflerin?',
    help: 'Birden fazla hedef varsa ikincisini de seç.',
    required: true,
    primaryLabel: 'Birincil hedef',
    secondaryLabel: 'İkincil hedef (opsiyonel)',
    secondaryOptional: true,
    options: [
      { value: 'yag_kaybi', label: 'Yağ kaybı + form alma' },
      { value: 'kas_kazanimi', label: 'Kas kazanımı' },
      { value: 'kuvvet', label: 'Kuvvet artışı' },
      { value: 'kondisyon', label: 'Kondisyon (cardio)' },
      { value: 'estetik', label: 'Estetik (vücut şekli)' },
      { value: 'performans', label: 'Spor performansı' },
      { value: 'saglik', label: 'Sağlık & uzun ömür' },
      { value: 'mobilite', label: 'Hareket kapasitesi / mobilite' },
      { value: 'stres', label: 'Stres yönetimi' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'primary_goal',
    },
    secondaryDb: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'secondary_goal',
    },
  },
  {
    id: 'training_frequency',
    type: 'single_select',
    label: 'Haftada kaç gün antrenman yapıyorsun?',
    required: true,
    options: [
      { value: '0', label: 'Hiç' },
      { value: '1_2', label: '1-2 gün' },
      { value: '3_4', label: '3-4 gün' },
      { value: '5_6', label: '5-6 gün' },
      { value: '7', label: 'Her gün' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'training_frequency',
    },
  },
  {
    id: 'training_types',
    type: 'multi_select',
    label: 'Hangi tarzda hareketler hayatında var?',
    help: 'Birden fazla seçebilirsin.',
    required: true,
    allowOther: true,
    options: [
      { value: 'agirlik', label: 'Ağırlık / kuvvet' },
      { value: 'cardio', label: 'Cardio (koşu, bisiklet)' },
      { value: 'hiit', label: 'HIIT / Crossfit' },
      { value: 'pilates', label: 'Pilates / Reformer' },
      { value: 'yoga', label: 'Yoga' },
      { value: 'saha', label: 'Saha sporu (futbol, basket vb.)' },
      { value: 'tenis', label: 'Tenis / Badminton' },
      { value: 'yuzme', label: 'Yüzme' },
      { value: 'yuruyus', label: 'Yürüyüş / Doğa' },
      { value: 'dans', label: 'Dans / Hareket sanatları' },
      { value: 'boks', label: 'Boks / Dövüş sporu' },
      { value: 'yok', label: 'Yok' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'training_types',
    },
  },
  {
    id: 'active_injuries',
    type: 'multi_select',
    label: 'Şu an aktif sakatlığın veya ağrın var mı?',
    help: 'Plan güvenliği için kritik. Yoksa "Yok" seç.',
    required: true,
    options: [
      { value: 'yok', label: 'Yok' },
      { value: 'bel', label: 'Bel' },
      { value: 'boyun', label: 'Boyun' },
      { value: 'omuz', label: 'Omuz' },
      { value: 'diz', label: 'Diz' },
      { value: 'ayak_bilegi', label: 'Ayak bileği' },
      { value: 'kalca', label: 'Kalça' },
      { value: 'dirsek', label: 'Dirsek' },
      { value: 'el_bilegi', label: 'El bileği' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'active_injuries',
    },
  },
  {
    id: 'exercise_attitude',
    type: 'single_select',
    label: 'Egzersize yaklaşımın hangisine en yakın?',
    help: 'Yargılamadan, dürüst.',
    required: true,
    options: [
      {
        value: 'zorunlu',
        label: 'Sevmem ama yapmalıyım',
      },
      {
        value: 'severim_disiplin_zor',
        label: 'Severim ama disiplin tutmakta zorlanırım',
      },
      { value: 'severim_duzenli', label: 'Severim, düzenliyim' },
      { value: 'merkez', label: 'Hayatımın merkezinde' },
      { value: 'karisik', label: 'Karışık duygular var' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'attitude',
    },
  },
  {
    id: 'weekly_time_budget',
    type: 'single_select',
    label: 'Haftalık ayırabileceğin toplam süre?',
    help: 'Plan gerçekçiliği için.',
    required: true,
    options: [
      { value: '1_2_saat', label: '1-2 saat' },
      { value: '2_4_saat', label: '2-4 saat' },
      { value: '4_6_saat', label: '4-6 saat' },
      { value: '6_8_saat', label: '6-8 saat' },
      { value: '8_ustu', label: '8 saat ve üzeri' },
    ],
    db: {
      kind: 'jsonb',
      column: 'exercise_details',
      key: 'weekly_time_budget',
    },
  },
]

// ═══════════════════════════════════════════════════
// DIMENSION 3 — BLOOD (Kan Değerleri)
// ═══════════════════════════════════════════════════

const bloodQuestions: Question[] = [
  {
    id: 'recent_bloodwork',
    type: 'single_select',
    label: 'Son 12 ayda kan testi yaptırdın mı?',
    required: true,
    options: [
      { value: 'evet_elimde', label: 'Evet, sonuçlar elimde' },
      { value: 'evet_yok', label: 'Evet ama elimde yok' },
      { value: 'hayir', label: 'Hayır' },
    ],
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'recent_bloodwork',
    },
  },
  {
    id: 'known_deficiencies',
    type: 'multi_select',
    label: 'Bilinen değer eksikliklerin veya yüksekliklerin?',
    help: 'Birden fazla seçebilirsin.',
    required: true,
    options: [
      { value: 'yok', label: 'Yok / Bilmiyorum' },
      { value: 'b12', label: 'B12 eksikliği' },
      { value: 'd_vitamini', label: 'D vitamini eksikliği' },
      { value: 'demir', label: 'Demir eksikliği / Anemi' },
      { value: 'tiroid', label: 'Tiroid (hipo / hiper)' },
      { value: 'kolesterol', label: 'Yüksek kolesterol' },
      { value: 'seker', label: 'Yüksek şeker / İnsülin direnci' },
      { value: 'magnezyum', label: 'Magnezyum eksikliği' },
      { value: 'cinko', label: 'Çinko eksikliği' },
    ],
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'known_deficiencies',
    },
  },
  {
    id: 'family_history',
    type: 'multi_select',
    label: 'Ailede genetik yük (anne, baba, kardeş)?',
    help: 'Risk haritası için. Yoksa "Yok" seç.',
    required: true,
    options: [
      { value: 'yok', label: 'Yok / Bilmiyorum' },
      { value: 'diyabet', label: 'Diyabet' },
      { value: 'kalp', label: 'Kalp hastalığı' },
      { value: 'kanser', label: 'Kanser' },
      { value: 'obezite', label: 'Obezite' },
      { value: 'tiroid', label: 'Tiroid hastalığı' },
      { value: 'otoimmun', label: 'Otoimmün hastalık' },
      { value: 'hipertansiyon', label: 'Yüksek tansiyon' },
    ],
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'family_history',
    },
  },
  {
    id: 'medications',
    type: 'textarea',
    label: 'Düzenli kullandığın ilaçlar?',
    help: 'Yoksa boş bırakabilirsin.',
    required: false,
    placeholder: 'Örn: Eutirox 50mcg, Vitamin D haftalık...',
    maxLength: 500,
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'medications',
    },
  },
  {
    id: 'supplements',
    type: 'textarea',
    label: 'Vitamin veya takviye kullanıyor musun?',
    help: 'Yoksa boş bırakabilirsin.',
    required: false,
    placeholder: 'Örn: Magnezyum, Omega-3, B kompleks...',
    maxLength: 500,
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'supplements',
    },
  },
  {
    id: 'energy_pattern',
    type: 'single_select',
    label: 'Enerji düşüşünü en çok ne zaman yaşarsın?',
    required: true,
    options: [
      { value: 'sabah', label: 'Sabah uyandığımda' },
      { value: 'oglen', label: 'Öğleden sonra (14-16)' },
      { value: 'aksamustu', label: 'Akşamüstü' },
      { value: 'aksam', label: 'Akşam' },
      { value: 'genel_dusuk', label: 'Sürekli düşük' },
      { value: 'sorun_yok', label: 'Enerji sorunum yok' },
    ],
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'energy_pattern',
    },
  },
  {
    id: 'sleep_hours',
    type: 'slider',
    label: 'Ortalama günde kaç saat uyuyorsun?',
    help: 'Hormonal dengenin en güçlü göstergesi.',
    required: true,
    min: 4,
    max: 10,
    step: 0.5,
    unit: 'saat',
    minLabel: '4 saat',
    maxLabel: '10 saat',
    db: { kind: 'jsonb', column: 'bloodwork_details', key: 'sleep_hours' },
  },
  {
    id: 'wants_to_share_results',
    type: 'single_select',
    label: 'Test sonuçlarını humanOS ile paylaşmak ister misin?',
    help: 'Premium analiz için. Şimdi olmasa da olur.',
    required: true,
    options: [
      { value: 'evet', label: 'Evet, paylaşmaya hazırım' },
      { value: 'sonra', label: 'Sonra paylaşacağım' },
      { value: 'hayir', label: 'Hayır' },
    ],
    db: {
      kind: 'jsonb',
      column: 'bloodwork_details',
      key: 'wants_to_share_results',
    },
  },
]

// ═══════════════════════════════════════════════════
// DIMENSION 4 — HABITS (Alışkanlıklar)
// ═══════════════════════════════════════════════════

const habitsQuestions: Question[] = [
  {
    id: 'smoking_status',
    type: 'single_select',
    label: 'Sigara kullanımın?',
    required: true,
    options: [
      { value: 'hic', label: 'Hiç içmedim' },
      { value: 'birakti', label: 'Bıraktım' },
      { value: 'sosyal', label: 'Sosyal — ara sıra' },
      { value: 'gunluk', label: 'Düzenli / günlük' },
    ],
    db: { kind: 'structured', column: 'habits_smoking_status' },
  },
  {
    id: 'alcohol_frequency',
    type: 'single_select',
    label: 'Alkol tüketim sıklığın?',
    required: true,
    options: [
      { value: 'hic', label: 'Hiç' },
      { value: 'ayda_1_3', label: 'Ayda 1-3 kez' },
      { value: 'haftada_1_2', label: 'Haftada 1-2 kez' },
      { value: 'haftada_3_ustu', label: 'Haftada 3+ kez' },
      { value: 'gunluk', label: 'Hemen her gün' },
    ],
    db: { kind: 'structured', column: 'habits_alcohol_frequency' },
  },
  {
    id: 'caffeine_intake',
    type: 'single_select',
    label: 'Kafein tüketim paterin?',
    help: 'Kahve, çay, enerji içeceği — toplam.',
    required: true,
    options: [
      { value: 'hic', label: 'Hiç tüketmem' },
      { value: '1_fincan', label: 'Günde 1 fincan' },
      { value: '2_3_fincan', label: 'Günde 2-3 fincan' },
      { value: '4_ustu', label: 'Günde 4 ve üzeri' },
      { value: 'cay', label: 'Sadece çay tüketirim' },
    ],
    db: {
      kind: 'jsonb',
      column: 'habits_details',
      key: 'caffeine_intake',
    },
  },
  {
    id: 'stress_level',
    type: 'slider',
    label: 'Genel stres seviyen?',
    help: 'Son 1 ay ortalaması.',
    required: true,
    min: 1,
    max: 10,
    step: 1,
    minLabel: 'Sıfır',
    maxLabel: 'Tepede',
    db: { kind: 'jsonb', column: 'habits_details', key: 'stress_level' },
  },
  {
    id: 'screen_time',
    type: 'single_select',
    label: 'Günlük ekran ve sosyal medya kullanımın?',
    help: 'İş dışında, kişisel kullanım.',
    required: true,
    options: [
      { value: 'cok_az', label: 'Çok az (<1 saat)' },
      { value: '1_2_saat', label: '1-2 saat' },
      { value: '3_4_saat', label: '3-4 saat' },
      { value: '5_6_saat', label: '5-6 saat' },
      { value: '7_ustu', label: '7 saat ve üzeri' },
    ],
    db: {
      kind: 'jsonb',
      column: 'habits_details',
      key: 'screen_time',
    },
  },
  {
    id: 'outdoor_time',
    type: 'single_select',
    label: 'Doğa veya dış mekanda geçirdiğin zaman?',
    help: 'Vitamin D, sirkadiyen ritim, biyofili için.',
    required: true,
    options: [
      { value: 'neredeyse_hic', label: 'Neredeyse hiç' },
      { value: 'haftada_1_2', label: 'Haftada 1-2 kez kısa' },
      { value: 'gunluk_kisa', label: 'Her gün kısa (15-30 dk)' },
      { value: 'gunluk_uzun', label: 'Her gün uzun (1+ saat)' },
      { value: 'cok_aktif', label: 'Çok aktifim, doğa hayatımda' },
    ],
    db: {
      kind: 'jsonb',
      column: 'habits_details',
      key: 'outdoor_time',
    },
  },
  {
    id: 'social_connection',
    type: 'slider',
    label: 'Sosyal bağlantı tatminin nasıl?',
    help: 'Aile, arkadaşlık, partner — genel hisset.',
    required: true,
    min: 1,
    max: 10,
    step: 1,
    minLabel: 'Yalnızım',
    maxLabel: 'Çok zenginim',
    db: {
      kind: 'jsonb',
      column: 'habits_details',
      key: 'social_connection',
    },
  },
  {
    id: 'one_habit_to_change',
    type: 'textarea',
    label: 'Hayatında değiştirmek istediğin tek alışkanlık?',
    help: 'Kendi sözlerinle yaz. Bu cevap senin pusulan.',
    required: true,
    placeholder: 'Örn: Akşam ekrana bakmadan uyumak istiyorum...',
    maxLength: 300,
    db: {
      kind: 'jsonb',
      column: 'habits_details',
      key: 'one_habit_to_change',
    },
  },
]

// ═══════════════════════════════════════════════════
// REGISTRY + LABELS
// ═══════════════════════════════════════════════════

export const questionsByDimension: Record<Dimension, Question[]> = {
  nutrition: nutritionQuestions,
  exercise: exerciseQuestions,
  blood: bloodQuestions,
  habits: habitsQuestions,
}

export const dimensionLabels: Record<Dimension, string> = {
  nutrition: 'Beslenme',
  exercise: 'Egzersiz',
  blood: 'Kan Değerleri',
  habits: 'Alışkanlıklar',
}

export const dimensionEmojis: Record<Dimension, string> = {
  nutrition: '🍎',
  exercise: '💪',
  blood: '🩸',
  habits: '🔄',
}

export const dimensionTaglines: Record<Dimension, string> = {
  nutrition: 'enerjinin başladığı yer',
  exercise: 'hareketin hikayesi',
  blood: 'içerden gelen sinyaller',
  habits: 'günün gizli mimarisi',
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

export function getQuestionsForStep(
  selectedDims: Dimension[],
  stepNumber: number
): { dimension: Dimension; questions: Question[] } | null {
  const dimIndex = stepNumber - 1
  if (dimIndex < 0 || dimIndex >= selectedDims.length) return null

  const dim = selectedDims[dimIndex]
  return {
    dimension: dim,
    questions: questionsByDimension[dim],
  }
}

export function getTotalSteps(selectedDims: Dimension[]): number {
  return selectedDims.length
}
