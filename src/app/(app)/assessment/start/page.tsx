import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GatewayClient from "./GatewayClient";
import ResumeAssessment from "./ResumeAssessment";

/**
 * humanOS — Comprehensive Life Analysis Gateway (Server Component)
 *
 * URL: /assessment/start
 *
 * Bu sayfa Comprehensive Form'un giriş kapısı.
 *
 * Akış:
 * 1. Auth check (defense in depth — proxy.ts zaten korur)
 * 2. Mevcut in_progress assessment var mı?
 *    - Varsa: ResumeAssessment göster (Devam / Yeniden Başla)
 *    - Yoksa: GatewayClient göster (Path + alan seçimi)
 *
 * Mimari:
 * - Server: Auth + DB query (mevcut assessment kontrolü)
 * - Client (GatewayClient): State + path/dimension seçimi + Supabase insert
 * - Client (ResumeAssessment): "Devam" / "Yeniden Başla" butonları
 *
 * Day 9'un kalbi — humanOS'un gerçek değer önerisi buradan başlıyor.
 */

type ActiveAssessment = {
  id: string;
  assessment_path: "focused" | "general";
  selected_dimensions: string[];
  current_step: number;
  status: "in_progress" | "completed" | "reviewed_by_coach";
  created_at: string;
};

export default async function AssessmentStartPage() {
  const supabase = await createClient();

  // 1. User'ı al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Defense in depth
  if (!user) {
    redirect("/sign-in");
  }

  // 3. Mevcut in_progress assessment var mı?
  // (deleted_at IS NULL filtreleme RLS'de yok, manuel ekliyoruz — soft delete)
  const { data: activeAssessment } = await supabase
    .from("life_assessments")
    .select(
      "id, assessment_path, selected_dimensions, current_step, status, created_at"
    )
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ActiveAssessment>();

  // 4. Yarım kalan varsa: ResumeAssessment, yoksa GatewayClient
  if (activeAssessment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <ResumeAssessment assessment={activeAssessment} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Sayfa Başlığı */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Yaşam Analizine Hoş Geldin
        </h1>
        <p className="text-humanos-text-muted max-w-xl mx-auto">
          Kendine özel bir yaşam haritası kurmaya hazır mısın? İki farklı
          yoldan biriyle başlayabilirsin.
        </p>
      </div>

      {/* Path Seçimi (Client Component) */}
      <GatewayClient />
    </div>
  );
}
