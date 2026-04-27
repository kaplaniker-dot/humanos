"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — GatewayClient (Client Component)
 *
 * Comprehensive Form'un giriş kapısı.
 *
 * İki ekran state:
 * 1. Path Seçimi: Odaklı vs Genel
 * 2. Alan Seçimi (sadece Odaklı için): 1-3 boyut seç
 *
 * Akış:
 * - Path seçilir
 * - Eğer Odaklı: alan seçim ekranına geç
 * - Eğer Genel: doğrudan insert + redirect (alan otomatik 4)
 * - INSERT life_assessments → yeni id döner
 * - Redirect: /assessment/{id}/step/1
 */

type AssessmentPath = "focused" | "general";

const dimsList = [
  {
    value: "nutrition",
    label: "Beslenme",
    emoji: "🍎",
    description: "Yeme alışkanlıkların",
  },
  {
    value: "exercise",
    label: "Egzersiz",
    emoji: "💪",
    description: "Hareket düzenin",
  },
  {
    value: "bloodwork",
    label: "Kan Değerleri",
    emoji: "🩸",
    description: "Sağlık göstergeleri",
  },
  {
    value: "habits",
    label: "Alışkanlıklar",
    emoji: "🔄",
    description: "Günlük rutin",
  },
] as const;

const allDimsValues = dimsList.map((d) => d.value);

export default function GatewayClient() {
  const router = useRouter();

  const [screen, setScreen] = useState<"path" | "dimensions">("path");
  const [selectedPath, setSelectedPath] = useState<AssessmentPath | null>(null);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePathSelect = async (path: AssessmentPath) => {
    setSelectedPath(path);
    setErrorMessage("");

    if (path === "focused") {
      setScreen("dimensions");
    } else {
      await createAssessment("general", allDimsValues);
    }
  };

  const handleDimensionToggle = (value: string) => {
    setSelectedDimensions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleFocusedSubmit = async () => {
    if (selectedDimensions.length === 0) {
      setErrorMessage("En az bir alan seç.");
      return;
    }
    await createAssessment("focused", selectedDimensions);
  };

  const handleBack = () => {
    setScreen("path");
    setSelectedPath(null);
    setSelectedDimensions([]);
    setErrorMessage("");
  };

  const createAssessment = async (
    path: AssessmentPath,
    dimensions: readonly string[]
  ) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("Oturumun sona ermiş. Lütfen tekrar giriş yap.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("life_assessments")
        .insert({
          user_id: user.id,
          assessment_path: path,
          selected_dimensions: dimensions,
          status: "in_progress",
          current_step: 1,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error("[Gateway] Insert error:", error?.message);
        setErrorMessage("Analiz başlatılamadı. Lütfen tekrar dene.");
        setIsLoading(false);
        return;
      }

      console.log("[Gateway] Created assessment:", data.id);
      router.push(`/assessment/${data.id}/step/1`);
    } catch (err) {
      console.error("[Gateway] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl px-8 py-12 text-center">
        <div className="text-humanos-text-muted text-sm">Hazırlanıyor...</div>
      </div>
    );
  }

  // EKRAN 1 — Path Seçimi
  if (screen === "path") {
    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handlePathSelect("focused")}
            className="group bg-humanos-surface border border-humanos-border hover:border-humanos-accent/50 rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-lg font-medium text-humanos-text mb-2">
              Odaklı Analiz
            </h2>
            <p className="text-sm text-humanos-text-muted mb-4 leading-relaxed">
              Belirli alanlarda yardım istiyorum.
            </p>
            <ul className="space-y-1.5 text-xs text-humanos-text-subtle mb-6">
              <li>• 1-3 alan seç</li>
              <li>• Seçtiğin alanlarda derin form</li>
              <li>• ~10-15 dakika</li>
            </ul>
            <span className="inline-flex items-center gap-1 text-sm text-humanos-accent group-hover:gap-2 transition-all font-medium">
              Bu yolu seç →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handlePathSelect("general")}
            className="group bg-humanos-surface border border-humanos-border hover:border-humanos-accent/50 rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
          >
            <div className="text-3xl mb-3">🌍</div>
            <h2 className="text-lg font-medium text-humanos-text mb-2">
              Genel Yaşam Analizi
            </h2>
            <p className="text-sm text-humanos-text-muted mb-4 leading-relaxed">
              Genel olarak iyileşmek istiyorum.
            </p>
            <ul className="space-y-1.5 text-xs text-humanos-text-subtle mb-6">
              <li>• 4 alanı kısa kısa kapsa</li>
              <li>• Sistem zayıf alanlarını söyler</li>
              <li>• ~5-7 dakika</li>
            </ul>
            <span className="inline-flex items-center gap-1 text-sm text-humanos-accent group-hover:gap-2 transition-all font-medium">
              Bu yolu seç →
            </span>
          </button>
        </div>
      </div>
    );
  }

  // EKRAN 2 — Alan Seçimi
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-display font-semibold text-humanos-text">
          Hangi alanlarda destek istiyorsun?
        </h2>
        <p className="text-sm text-humanos-text-muted">
          1-3 alan seç ({selectedDimensions.length}/3 seçili)
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dimsList.map((dim) => {
          const isSelected = selectedDimensions.includes(dim.value);
          const isDisabled = !isSelected && selectedDimensions.length >= 3;

          return (
            <button
              key={dim.value}
              type="button"
              onClick={() => handleDimensionToggle(dim.value)}
              disabled={isDisabled}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "bg-humanos-accent/10 border-humanos-accent"
                  : isDisabled
                    ? "bg-humanos-surface/50 border-humanos-border opacity-40 cursor-not-allowed"
                    : "bg-humanos-surface border-humanos-border hover:border-humanos-accent/50"
              }`}
            >
              <div className="text-2xl">{dim.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-humanos-text">
                  {dim.label}
                </div>
                <div className="text-xs text-humanos-text-muted">
                  {dim.description}
                </div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-humanos-accent flex items-center justify-center text-humanos-bg text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-humanos-text-muted hover:text-humanos-text transition-colors text-center sm:text-left"
        >
          ← Geri
        </button>

        <button
          type="button"
          onClick={handleFocusedSubmit}
          disabled={selectedDimensions.length === 0}
          className="bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Devam →
        </button>
      </div>
    </div>
  );
}
