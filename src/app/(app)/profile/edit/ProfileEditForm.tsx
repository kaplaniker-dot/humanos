"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — Profile Edit Form (Client Component)
 *
 * /profile/edit sayfasının form kısmı.
 * Server Component (page.tsx) initial profile data'yı prop olarak verir.
 * Burada form state + validation + Supabase update.
 *
 * UX Kararları:
 * - Tüm alanlar OPSIYONEL — kullanıcı istediği kadarını doldurur
 * - Üstte info banner ile "opsiyonel" mesajı
 * - Geri dön linki — düzenlemeyi iptal etme yolu
 * - Success → /profile sayfasına yönlendirme + cache refresh
 *
 * Validation:
 * - Boş string → null'a çevrilir (DB tutarlılığı için)
 * - Number alanları (height_cm, weight_kg) string'den parse edilir
 * - Date alanı YYYY-MM-DD formatında DB'ye gider
 */

// Zod schema — tüm alanlar opsiyonel
// Boş string'e izin var (kullanıcı temizleyebilsin diye)
const profileEditSchema = z.object({
  full_name: z
    .string()
    .max(100, "Ad-soyad 100 karakteri geçemez")
    .optional()
    .or(z.literal("")),
  birth_date: z
    .string()
    .optional()
    .or(z.literal("")),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .or(z.literal("")),
  height_cm: z
    .string()
    .optional()
    .or(z.literal("")),
  weight_kg: z
    .string()
    .optional()
    .or(z.literal("")),
  primary_goal: z
    .enum(["longevity", "performance", "weight_loss", "energy", "focus", "custom"])
    .optional()
    .or(z.literal("")),
});

// Server'dan gelen initial data tipi
type ProfileFormData = {
  full_name: string | null;
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  primary_goal: string | null;
};

export default function ProfileEditForm({
  initialData,
}: {
  initialData: ProfileFormData;
}) {
  const router = useRouter();

  // Form state — initial data ile pre-fill
  const [fullName, setFullName] = useState(initialData.full_name ?? "");
  const [birthDate, setBirthDate] = useState(initialData.birth_date ?? "");
  const [gender, setGender] = useState(initialData.gender ?? "");
  const [heightCm, setHeightCm] = useState(
    initialData.height_cm?.toString() ?? ""
  );
  const [weightKg, setWeightKg] = useState(
    initialData.weight_kg?.toString() ?? ""
  );
  const [primaryGoal, setPrimaryGoal] = useState(
    initialData.primary_goal ?? ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Zod validation
    const validation = profileEditSchema.safeParse({
      full_name: fullName,
      birth_date: birthDate,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
      primary_goal: primaryGoal,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    // 2. Number validation (manuel — Zod string olarak alır)
    let parsedHeight: number | null = null;
    if (heightCm !== "") {
      parsedHeight = parseInt(heightCm, 10);
      if (isNaN(parsedHeight) || parsedHeight <= 0 || parsedHeight >= 300) {
        setErrorMessage("Boy 1-299 cm arasında olmalı");
        return;
      }
    }

    let parsedWeight: number | null = null;
    if (weightKg !== "") {
      parsedWeight = parseFloat(weightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight >= 500) {
        setErrorMessage("Kilo 0.1-499 kg arasında olmalı");
        return;
      }
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 3. User'ı al (RLS için kendi id'mizi bilmemiz lazım)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("Oturumun sona ermiş. Lütfen tekrar giriş yap.");
        return;
      }

      // 4. Update payload — boş string'leri null yap (DB tutarlılığı)
      const updatePayload = {
        full_name: fullName.trim() || null,
        birth_date: birthDate || null,
        gender: gender || null,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        primary_goal: primaryGoal || null,
      };

      // 5. Supabase update (RLS otomatik filtreler — kendi satırımızı günceller)
      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) {
        console.error("[Profile Edit] Update error:", error.message);
        setErrorMessage(translateUpdateError(error.message));
        return;
      }

      // 6. Başarılı — /profile'a dön ve cache'i yenile
      console.log("[Profile Edit] Success!");
      router.push("/profile");
      router.refresh(); // Server Component cache'ini yenile
    } catch (err) {
      console.error("[Profile Edit] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner — Opsiyonel */}
      <div className="bg-humanos-accent/10 border border-humanos-accent/20 rounded-xl px-4 py-3">
        <p className="text-sm text-humanos-text-muted">
          💡 Tüm alanlar opsiyonel. İstediğin zaman güncelleyebilirsin.
        </p>
      </div>

      {/* Error Box */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Form Kartı */}
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-6">
        {/* Ad-Soyad */}
        <div className="space-y-2">
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-humanos-text"
          >
            Ad-Soyad
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Örn. İlker Kaplan"
            className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        {/* Doğum Tarihi */}
        <div className="space-y-2">
          <label
            htmlFor="birth_date"
            className="block text-sm font-medium text-humanos-text"
          >
            Doğum Tarihi
          </label>
          <input
            id="birth_date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            min="1900-01-01"
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
            disabled={isLoading}
          />
          <p className="text-xs text-humanos-text-subtle">
            Yaşını hesaplamak için kullanılır
          </p>
        </div>

        {/* Cinsiyet */}
        <div className="space-y-2">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-humanos-text"
          >
            Cinsiyet
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text focus:outline-none focus:border-humanos-accent transition-colors"
            disabled={isLoading}
          >
            <option value="">Seçiniz...</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
            <option value="other">Diğer</option>
            <option value="prefer_not_to_say">Belirtmek istemiyorum</option>
          </select>
          <p className="text-xs text-humanos-text-subtle">
            Sağlık metrikleri için referans aralıkları
          </p>
        </div>

        {/* Boy + Kilo (yan yana büyük ekranda) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Boy */}
          <div className="space-y-2">
            <label
              htmlFor="height_cm"
              className="block text-sm font-medium text-humanos-text"
            >
              Boy (cm)
            </label>
            <input
              id="height_cm"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="180"
              min="1"
              max="299"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Kilo */}
          <div className="space-y-2">
            <label
              htmlFor="weight_kg"
              className="block text-sm font-medium text-humanos-text"
            >
              Kilo (kg)
            </label>
            <input
              id="weight_kg"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="75.5"
              min="0.1"
              max="499.9"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Birincil Hedef */}
        <div className="space-y-2">
          <label
            htmlFor="primary_goal"
            className="block text-sm font-medium text-humanos-text"
          >
            Birincil Hedef
          </label>
          <select
            id="primary_goal"
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text focus:outline-none focus:border-humanos-accent transition-colors"
            disabled={isLoading}
          >
            <option value="">Seçiniz...</option>
            <option value="longevity">Uzun Ömür</option>
            <option value="performance">Yüksek Performans</option>
            <option value="weight_loss">Kilo Kontrolü</option>
            <option value="energy">Enerji</option>
            <option value="focus">Odak</option>
            <option value="custom">Kişisel Hedef</option>
          </select>
          <p className="text-xs text-humanos-text-subtle">
            humanOS önerilerini bu hedefe göre kişiselleştirir
          </p>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Geri dön linki */}
        <Link
          href="/profile"
          className="text-sm text-humanos-text-muted hover:text-humanos-text transition-colors text-center sm:text-left"
        >
          ← Profile geri dön
        </Link>

        {/* Submit butonu */}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? "Kaydediliyor..." : "Kaydet →"}
        </button>
      </div>
    </form>
  );
}

/**
 * Supabase update hata mesajlarını Türkçe'ye çevir.
 */
function translateUpdateError(message: string): string {
  // CHECK constraint hatası (örn. height_cm > 0)
  if (message.includes("check constraint") || message.includes("violates")) {
    return "Girdiğin değerlerden biri geçersiz. Lütfen kontrol et.";
  }
  // RLS politika hatası
  if (message.includes("policy") || message.includes("permission")) {
    return "Bu işlem için yetkin yok. Lütfen tekrar giriş yap.";
  }
  // Genel hata
  return "Profilini güncelleyemedik. Lütfen tekrar dene.";
}
