import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * humanOS — Profile Page (Server Component)
 *
 * URL: /profile
 * Layout: src/app/(app)/layout.tsx (mevcut, dashboard ile paylaşılan)
 *
 * Bu bir Server Component:
 * - "use client" yok
 * - Veri server'da fetch edilir
 * - HTML olarak render edilir, JS bundle minimum
 * - Loading state yok — sayfa açıldığında veri zaten dolu
 *
 * Akış:
 * 1. Supabase server client yarat
 * 2. Şu an login olan kullanıcıyı al
 * 3. profiles tablosundan kullanıcının profilini çek
 * 4. 3 kart halinde göster: Kişisel, Hedef, Hesap
 * 5. Boş alanlar için "henüz girilmedi" placeholder'ı
 *
 * Güvenlik:
 * - proxy.ts zaten /profile'a login olmadan erişimi engeller
 * - Ek olarak burada da getUser() kontrolü (defense in depth)
 * - RLS otomatik çalışır — kullanıcı sadece kendi satırını görür
 */

// Tip tanımı — profiles tablosuyla birebir uyumlu
type Profile = {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  height_cm: number | null;
  weight_kg: number | null;
  primary_goal:
    | "longevity"
    | "performance"
    | "weight_loss"
    | "energy"
    | "focus"
    | "custom"
    | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // 1. Giriş yapmış kullanıcıyı al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Defense in depth — proxy.ts zaten korur ama ekstra güvenlik
  if (!user) {
    redirect("/sign-in");
  }

  // 3. Profile'ı çek (RLS otomatik filtreler)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (error) {
    console.error("[Profile] Fetch error:", error.message);
    // Profile yoksa (eski kullanıcı, trigger eklemeden önce kayıt olmuş) — hata göster
    return <ProfileError />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Sayfa Başlığı */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Profil
        </h1>
        <p className="text-humanos-text-muted">
          Kim olduğun, ne hedeflediğin — humanOS bunları seninle birlikte
          öğreniyor.
        </p>
      </div>

      {/* Kart 1 — Kişisel Bilgiler */}
      <ProfileCard
        title="Kişisel Bilgiler"
        editHref="/profile/edit"
        rows={[
          { label: "Ad-Soyad", value: profile.full_name },
          {
            label: "Doğum Tarihi",
            value: formatDate(profile.birth_date),
          },
          {
            label: "Cinsiyet",
            value: translateGender(profile.gender),
          },
          {
            label: "Boy",
            value: profile.height_cm ? `${profile.height_cm} cm` : null,
          },
          {
            label: "Kilo",
            value: profile.weight_kg ? `${profile.weight_kg} kg` : null,
          },
        ]}
      />

      {/* Kart 2 — Hedef */}
      <ProfileCard
        title="Hedef"
        editHref="/profile/edit"
        rows={[
          {
            label: "Birincil Hedef",
            value: translateGoal(profile.primary_goal),
          },
        ]}
      />

      {/* Kart 3 — Hesap Bilgileri (read-only) */}
      <ProfileCard
        title="Hesap Bilgileri"
        rows={[
          { label: "E-posta", value: user.email ?? null },
          {
            label: "Üyelik",
            value: formatDate(profile.created_at),
          },
          { label: "Saat Dilimi", value: profile.timezone },
        ]}
      />
    </div>
  );
}

/**
 * Yeniden kullanılabilir bilgi kartı.
 * Title + opsiyonel "Düzenle" linki + label/value satırları.
 */
function ProfileCard({
  title,
  editHref,
  rows,
}: {
  title: string;
  editHref?: string;
  rows: { label: string; value: string | null }[];
}) {
  return (
    <div className="bg-humanos-surface border border-humanos-border rounded-2xl overflow-hidden">
      {/* Kart başlığı */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-humanos-border">
        <h2 className="text-base font-medium text-humanos-text">{title}</h2>
        {editHref && (
          <Link
            href={editHref}
            className="text-sm text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            Düzenle →
          </Link>
        )}
      </div>

      {/* Satırlar */}
      <div className="divide-y divide-humanos-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-6 py-4"
          >
            <span className="text-sm text-humanos-text-muted">
              {row.label}
            </span>
            <span className="text-sm text-humanos-text">
              {row.value ?? (
                <span className="text-humanos-text-subtle italic">
                  henüz girilmedi
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Profile çekilemediyse gösterilen hata durumu.
 */
function ProfileError() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-8 text-center">
        <h2 className="text-xl font-medium text-red-400 mb-2">
          Profilin yüklenemedi
        </h2>
        <p className="text-sm text-humanos-text-muted">
          Bir şeyler ters gitti. Lütfen sayfayı yenile veya destekle iletişime
          geç.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Yardımcı format/çeviri fonksiyonları
// ─────────────────────────────────────────────────────────

/**
 * ISO date string'i Türkçe formata çevir.
 * "2026-04-26" → "26 Nisan 2026"
 */
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Cinsiyet enum değerini Türkçe'ye çevir.
 */
function translateGender(gender: Profile["gender"]): string | null {
  if (!gender) return null;

  const map: Record<NonNullable<Profile["gender"]>, string> = {
    male: "Erkek",
    female: "Kadın",
    other: "Diğer",
    prefer_not_to_say: "Belirtmek istemiyorum",
  };

  return map[gender];
}

/**
 * Hedef enum değerini Türkçe'ye çevir.
 */
function translateGoal(goal: Profile["primary_goal"]): string | null {
  if (!goal) return null;

  const map: Record<NonNullable<Profile["primary_goal"]>, string> = {
    longevity: "Uzun Ömür",
    performance: "Yüksek Performans",
    weight_loss: "Kilo Kontrolü",
    energy: "Enerji",
    focus: "Odak",
    custom: "Kişisel Hedef",
  };

  return map[goal];
}
