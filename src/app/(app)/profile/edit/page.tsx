import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "./ProfileEditForm";

/**
 * humanOS — Profile Edit Page (Server Component)
 *
 * URL: /profile/edit
 * Layout: src/app/(app)/layout.tsx (mevcut, paylaşılan)
 *
 * Bu sayfa Server Component — sadece veri fetch eder, ProfileEditForm'a
 * prop olarak geçirir. Form etkileşimi (state, validation, submit) Client
 * Component'te (ProfileEditForm.tsx) yönetilir.
 *
 * Niye böyle?
 * - Sayfa hızlı yüklenir (server-rendered HTML)
 * - Form state yönetimi gerekli (Client Component zorunlu)
 * - En iyi performans + en temiz ayrım
 *
 * Akış:
 * 1. User'ı al
 * 2. Profile'ı çek
 * 3. Form'u initial data ile render et
 */

export default async function ProfileEditPage() {
  const supabase = await createClient();

  // 1. Giriş yapmış kullanıcıyı al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Defense in depth — proxy.ts zaten korur
  if (!user) {
    redirect("/sign-in");
  }

  // 3. Profile'ı çek (RLS otomatik filtreler)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, birth_date, gender, height_cm, weight_kg, primary_goal")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("[Profile Edit] Fetch error:", error?.message);
    redirect("/profile");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Sayfa Başlığı */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Profili Düzenle
        </h1>
        <p className="text-humanos-text-muted">
          Bilgilerini güncelle — humanOS önerilerini bu verilere göre
          şekillendirir.
        </p>
      </div>

      {/* Form */}
      <ProfileEditForm initialData={profile} />
    </div>
  );
}
