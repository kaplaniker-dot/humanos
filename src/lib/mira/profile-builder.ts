// src/lib/mira/profile-builder.ts
// Day 10 form cevaplarını (DB row) AI'ın anlayacağı prose formata çevirir
// Day 11 V1 — Premium AI rapor için kullanıcı bağlamı

import type { AssessmentRow } from '@/lib/assessment/parse'

// ═══════════════════════════════════════════════════
// HELPER LABELS — Türkçe etiketler
// ═══════════════════════════════════════════════════

const goalLabels: Record<string, string> = {
  yag_kaybi: 'yağ kaybı + form alma',
  kas_kazanimi: 'kas kazanımı',
  performans: 'performans',
  saglik_uzun_omur: 'sağlık & uzun ömür',
  sindirim_enerji: 'sindirim/enerji',
  hastalik_yonetimi: 'hastalık yönetimi',
  kuvvet: 'kuvvet artışı',
  kondisyon: 'kondisyon (cardio)',
  estetik: 'estetik (vücut şekli)',
  saglik: 'sağlık & uzun ömür',
  mobilite: 'hareket kapasitesi / mobilite',
  stres: 'stres yönetimi',
}

const dietLabels: Record<string, string> = {
  standart: 'Standart (omnivor)',
  akdeniz: 'Akdeniz',
  dusuk_karb: 'Düşük karbonhidrat',
  keto: 'Ketojenik',
  aralikli_oruc: 'Aralıklı oruç',
  vejetaryen: 'Vejetaryen',
  vegan: 'Vegan',
  pesketaryen: 'Pesketaryen',
  karnivor: 'Karnivor',
  karisik: 'Hiçbiri / karışık',
}

const activityLabels: Record<string, string> = {
  sedanter: 'Çok az hareketli (masa başı)',
  hafif: 'Hafif aktif (haftada 1-2)',
  orta: 'Orta aktif (haftada 3-4)',
  yuksek: 'Yüksek aktif (haftada 5-6)',
  atlet: 'Profesyonel/atlet seviyesi',
}

const trainingFreqLabels: Record<string, string> = {
  '0': 'Hiç',
  '1_2': '1-2 gün/hafta',
  '3_4': '3-4 gün/hafta',
  '5_6': '5-6 gün/hafta',
  '7': 'Her gün',
}

const smokingLabels: Record<string, string> = {
  hic: 'Hiç içmedim',
  birakti: 'Bıraktım',
  sosyal: 'Sosyal — ara sıra',
  gunluk: 'Düzenli/günlük',
}

const alcoholLabels: Record<string, string> = {
  hic: 'Hiç tüketmem',
  ayda_1_3: 'Ayda 1-3 kez',
  haftada_1_2: 'Haftada 1-2 kez',
  haftada_3_ustu: 'Haftada 3+ kez',
  gunluk: 'Hemen her gün',
}

const genderLabels: Record<string, string> = {
  kadin: 'kadın',
  erkek: 'erkek',
  belirtmek_istemiyorum: 'belirtmemiş',
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function calculateBMI(heightCm?: number | null, weightKg?: number | null): string | null {
  if (!heightCm || !weightKg) return null
  const m = heightCm / 100
  const bmi = weightKg / (m * m)
  return bmi.toFixed(1)
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'düşük kilolu'
  if (bmi < 25) return 'sağlıklı bant'
  if (bmi < 30) return 'kilolu bant'
  return 'obez bant'
}

function formatList(arr: string[] | undefined | null, fallback = 'belirtilmemiş'): string {
  if (!arr || arr.length === 0) return fallback
  return arr.join(', ')
}

function getJsonbField<T = unknown>(
  bucket: Record<string, unknown> | null | undefined,
  key: string,
): T | undefined {
  if (!bucket) return undefined
  return bucket[key] as T
}

// ═══════════════════════════════════════════════════
// MAIN BUILDER
// ═══════════════════════════════════════════════════

export type UserContext = {
  userName: string
  userAgeBand?: '20-29' | '30-44' | '45+'
}

/**
 * AI rapor üretimi için kullanıcının full bağlamını
 * insan-okunabilir prose formuna çevirir.
 */
export function buildPremiumReportContext(
  assessment: AssessmentRow,
  userContext: UserContext,
): string {
  const lines: string[] = []

  // ─── Header ───
  lines.push('# KULLANICI BAĞLAMI')
  lines.push('')
  lines.push(`**Adı:** ${userContext.userName}`)
  lines.push(`**Tarih:** ${new Date().toISOString().split('T')[0]}`)
  lines.push('')

  // ─── Demografi ───
  const gender = assessment.gender ? genderLabels[assessment.gender] ?? assessment.gender : 'belirtilmemiş'
  const bmi = calculateBMI(assessment.height_cm, assessment.weight_kg)
  const bmiText = bmi ? ` — BMI ${bmi} (${bmiCategory(parseFloat(bmi))})` : ''

  lines.push('## Demografi')
  lines.push(`- Yaş: ${assessment.age ?? 'belirtilmemiş'}`)
  lines.push(`- Cinsiyet: ${gender}`)
  lines.push(`- Boy/Kilo: ${assessment.height_cm ?? '?'}cm / ${assessment.weight_kg ?? '?'}kg${bmiText}`)
  lines.push('')

  // ─── Beslenme ───
  const nutritionGoalPrimary = getJsonbField<string>(assessment.nutrition_details, 'primary_goal')
  const nutritionGoalSecondary = getJsonbField<string>(assessment.nutrition_details, 'secondary_goal')
  const chronicConditions = getJsonbField<string[]>(assessment.nutrition_details, 'chronic_conditions') ?? []
  const foodAllergies = getJsonbField<string[]>(assessment.nutrition_details, 'food_allergies') ?? []
  const energyLevel = getJsonbField<number>(assessment.nutrition_details, 'energy_level')
  const foodRelationship = getJsonbField<string>(assessment.nutrition_details, 'food_relationship')

  lines.push('## Beslenme')
  lines.push(`- Hedef: ${nutritionGoalPrimary ? goalLabels[nutritionGoalPrimary] ?? nutritionGoalPrimary : 'belirtilmemiş'}`)
  if (nutritionGoalSecondary) {
    lines.push(`  - İkincil: ${goalLabels[nutritionGoalSecondary] ?? nutritionGoalSecondary}`)
  }
  if (assessment.nutrition_primary_diet) {
    lines.push(`- Beslenme tarzı: ${dietLabels[assessment.nutrition_primary_diet] ?? assessment.nutrition_primary_diet}`)
  }
  lines.push(`- Kronik hastalıklar: ${formatList(chronicConditions)}`)
  lines.push(`- Gıda alerjileri: ${formatList(foodAllergies)}`)
  if (energyLevel !== undefined) {
    lines.push(`- Günlük enerji seviyesi: ${energyLevel}/10`)
  }
  if (foodRelationship) {
    lines.push(`- Yiyecekle ilişki: ${foodRelationship}`)
  }
  lines.push('')

  // ─── Egzersiz ───
  const activityLevel = getJsonbField<string>(assessment.exercise_details, 'activity_level')
  const trainingHistory = getJsonbField<string>(assessment.exercise_details, 'training_history')
  const exerciseGoalPrimary = getJsonbField<string>(assessment.exercise_details, 'primary_goal')
  const exerciseGoalSecondary = getJsonbField<string>(assessment.exercise_details, 'secondary_goal')
  const trainingTypes = getJsonbField<string[]>(assessment.exercise_details, 'training_types') ?? []
  const activeInjuries = getJsonbField<string[]>(assessment.exercise_details, 'active_injuries') ?? []
  const exerciseAttitude = getJsonbField<string>(assessment.exercise_details, 'attitude')
  const weeklyTimeBudget = getJsonbField<string>(assessment.exercise_details, 'weekly_time_budget')

  lines.push('## Egzersiz')
  if (activityLevel) {
    lines.push(`- Aktivite seviyesi: ${activityLabels[activityLevel] ?? activityLevel}`)
  }
  if (trainingHistory) {
    lines.push(`- Antrenman geçmişi: ${trainingHistory}`)
  }
  lines.push(`- Hedef: ${exerciseGoalPrimary ? goalLabels[exerciseGoalPrimary] ?? exerciseGoalPrimary : 'belirtilmemiş'}`)
  if (exerciseGoalSecondary) {
    lines.push(`  - İkincil: ${goalLabels[exerciseGoalSecondary] ?? exerciseGoalSecondary}`)
  }
  if (assessment.exercise_frequency_per_week !== null && assessment.exercise_frequency_per_week !== undefined) {
    const freqStr = String(assessment.exercise_frequency_per_week)
    lines.push(`- Antrenman sıklığı: ${trainingFreqLabels[freqStr] ?? freqStr}`)
  }
  lines.push(`- Antrenman tipleri: ${formatList(trainingTypes)}`)
  lines.push(`- Aktif sakatlık: ${formatList(activeInjuries, 'yok')}`)
  if (exerciseAttitude) {
    lines.push(`- Yaklaşım: ${exerciseAttitude}`)
  }
  if (weeklyTimeBudget) {
    lines.push(`- Haftalık zaman: ${weeklyTimeBudget}`)
  }
  lines.push('')

  // ─── Kan & Sağlık ───
  const recentBloodwork = getJsonbField<string>(assessment.bloodwork_details, 'recent_bloodwork')
  const knownDeficiencies = getJsonbField<string[]>(assessment.bloodwork_details, 'known_deficiencies') ?? []
  const familyHistory = getJsonbField<string[]>(assessment.bloodwork_details, 'family_history') ?? []
  const medications = getJsonbField<string>(assessment.bloodwork_details, 'medications')
  const supplements = getJsonbField<string>(assessment.bloodwork_details, 'supplements')
  const energyPattern = getJsonbField<string>(assessment.bloodwork_details, 'energy_pattern')
  const sleepHours = getJsonbField<number>(assessment.bloodwork_details, 'sleep_hours')

  lines.push('## Kan & Sağlık')
  if (recentBloodwork) {
    lines.push(`- Son kan testi: ${recentBloodwork}`)
  }
  lines.push(`- Bilinen değer eksiklikleri: ${formatList(knownDeficiencies, 'yok/bilmiyor')}`)
  lines.push(`- Aile öyküsü: ${formatList(familyHistory, 'yok/bilmiyor')}`)
  if (medications) {
    lines.push(`- Düzenli ilaçlar: ${medications}`)
  }
  if (supplements) {
    lines.push(`- Takviyeler: ${supplements}`)
  }
  if (energyPattern) {
    lines.push(`- Enerji düşüş zamanı: ${energyPattern}`)
  }
  if (sleepHours !== undefined) {
    lines.push(`- Ortalama uyku: ${sleepHours} saat`)
  }
  lines.push('')

  // ─── Alışkanlıklar ───
  const caffeineIntake = getJsonbField<string>(assessment.habits_details, 'caffeine_intake')
  const stressLevel = getJsonbField<number>(assessment.habits_details, 'stress_level')
  const screenTime = getJsonbField<string>(assessment.habits_details, 'screen_time')
  const outdoorTime = getJsonbField<string>(assessment.habits_details, 'outdoor_time')
  const socialConnection = getJsonbField<number>(assessment.habits_details, 'social_connection')
  const oneHabitToChange = getJsonbField<string>(assessment.habits_details, 'one_habit_to_change')

  lines.push('## Alışkanlıklar')
  if (assessment.habits_smoking_status) {
    lines.push(`- Sigara: ${smokingLabels[assessment.habits_smoking_status] ?? assessment.habits_smoking_status}`)
  }
  if (assessment.habits_alcohol_frequency) {
    lines.push(`- Alkol: ${alcoholLabels[assessment.habits_alcohol_frequency] ?? assessment.habits_alcohol_frequency}`)
  }
  if (caffeineIntake) {
    lines.push(`- Kafein: ${caffeineIntake}`)
  }
  if (stressLevel !== undefined) {
    lines.push(`- Stres seviyesi: ${stressLevel}/10`)
  }
  if (screenTime) {
    lines.push(`- Ekran/sosyal medya: ${screenTime}`)
  }
  if (outdoorTime) {
    lines.push(`- Doğa/dış mekan: ${outdoorTime}`)
  }
  if (socialConnection !== undefined) {
    lines.push(`- Sosyal bağlantı tatmini: ${socialConnection}/10`)
  }
  if (oneHabitToChange) {
    lines.push(`- Değiştirmek istediği tek alışkanlık: "${oneHabitToChange}"`)
  }
  lines.push('')

  // ─── Footer ───
  lines.push('---')
  lines.push('')
  lines.push('Bu bağlamı kullanarak Mira karakter prompt\'unda ve REPORT_PROMPT\'ta tanımlanan formata uygun şekilde JSON rapor üret.')

  return lines.join('\n')
}

/**
 * Yaş bandını hesapla — Mira'nın ton adaptasyonu için.
 */
export function ageBand(age?: number | null): UserContext['userAgeBand'] {
  if (!age) return undefined
  if (age < 30) return '20-29'
  if (age < 45) return '30-44'
  return '45+'
}
