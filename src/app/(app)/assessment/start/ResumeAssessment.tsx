"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — ResumeAssessment (Client Component)
 *
 * Kullanıcının yarım kalan assessment'ı varsa /assessment/start'ta görünür.
 *
 * 2 aksiyon:
 * - Devam Et: kaldığı step'e gider
 * - Yeniden Başla: confirm → RPC soft_delete_assessment → yeni gateway
 *
 * Not: Soft-delete için RPC function kullanıyoruz çünkü SELECT policy
 * deleted_at IS NULL filtresi içeriyor → standart .update() PostgREST'in
 * post-update SELECT'inde 403 verir. RPC SECURITY DEFINER bypass eder.
 */

type AssessmentForResume = {
  id: string;
  assessment_path: "focused" | "general";
  selected_dimensions: string[];
  current_step: number;
  status: "in_progress" | "completed" | "reviewed_by_coach";
  created_at: string;
};

const dimsLabels: Record<string, { label: string; emoji: string }> = {
  nutrition: { label: "Beslenme", emoji: "🍎" },
  exercise: { label: "Egzersiz", emoji: "💪" },
  bloodwork: { label: "Kan Değerleri", emoji: "🩸" },
  habits: { label: "Alışkanlıklar", emoji: "🔄" },
};

export default function ResumeAssessment({
  assessment,
}: {
  assessment: AssessmentForResume;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalSteps = assessment.selected_dimensions.length;
  const currentStep = assessment.current_step;

  const timeAgo = formatTimeAgo(assessment.created_at);

  const pathLabel =
    assessment.assessment_path === "focused"
      ? "Odaklı Analiz"
      : "Genel Yaşam Analizi";
  const pathEmoji = assessment.assessment_path === "focused" ? "🎯" : "🌍";

  const dimsText = assessment.selected_dimensions
    .map((d) => dimsLabels[d]?.label ?? d)
    .join(", ");

  const handleResume = () => {
    router.push(`/assessment/${assessment.id}/step/${currentStep}`);
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.rpc("soft_delete_assessment", {
        assessment_id: assessment.id,
      });

      if (error) {
        console.error("[Resume] Soft-delete error:", error.message);
        setErrorMessage("Sıfırlama başarısız. Lütfen tekrar dene.");
        setIsLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[Resume] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Yarım kalan analizin var
        </h1>
        <p className="text-humanos-text-muted">
          Kaldığın yerden devam edebilir veya baştan başlayabilirsin.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Assessment Bilgi Kartı */}
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{pathEmoji}</div>
          <div>
            <div className="text-base font-medium text-humanos-text">
              {pathLabel}
            </div>
            <div className="text-xs text-humanos-text-muted">
              {totalSteps} alan · {dimsText}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-humanos-text-muted">İlerleme</span>
            <span className="text-humanos-text">
              Adım {currentStep} / {totalSteps}
            </span>
          </div>
          <div className="h-1.5 bg-humanos-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-humanos-accent transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-humanos-text-subtle">{timeAgo}</div>
      </div>

      {/* Aksiyonlar */}
      {!showConfirm ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResume}
            disabled={isLoading}
            className="w-full bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Devam Et →
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isLoading}
            className="w-full text-sm text-humanos-text-muted hover:text-humanos-text disabled:opacity-50 transition-colors py-2"
          >
            Yeniden başla
          </button>
        </div>
      ) : (
        <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 space-y-4">
          <p className="text-sm text-humanos-text">
            Yeniden başlarsan mevcut cevapların silinir. Emin misin?
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="flex-1 text-sm text-humanos-text-muted hover:text-humanos-text disabled:opacity-50 transition-colors py-3 px-6 rounded-lg border border-humanos-border"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleRestart}
              disabled={isLoading}
              className="flex-1 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Sıfırlanıyor..." : "Evet, yeniden başla"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  const past = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Az önce başladın";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} dakika önce başladın`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} saat önce başladın`;
  }
  if (diffSec < 2592000) {
    const d = Math.floor(diffSec / 86400);
    return `${d} gün önce başladın`;
  }
  const months = Math.floor(diffSec / 2592000);
  return `${months} ay önce başladın`;
}
