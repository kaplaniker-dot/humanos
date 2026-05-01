import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserQuotaStatus } from "@/lib/mira/quota";

/**
 * humanOS — Dashboard Page
 *
 * Giriş yapmış kullanıcının ana sayfası.
 * URL: /dashboard
 *
 * Layout (akıllı, kullanıcının durumuna göre):
 * 1. Welcome Section (hoş geldin + BETA badge)
 * 2. Primary CTA — onaylı raporu varsa Mira, yoksa Yaşam Analizi
 * 3. Secondary CTA — diğeri
 * 4. Roadmap Section (gelecek özellikler)
 *
 * Server Component — kullanıcı bilgisini cookies'ten okur,
 * onaylı rapor + Mira quota durumunu service client ile çeker.
 *
 * Day 14 borç temizliği: firstName artık profiles.full_name'den geliyor
 * (önceden email-prefix kullanılıyordu — Day 8'den beri açık borçtu).
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Service client — RLS bypass, kesin veri (Day 12 pattern'i)
  let firstName = "dostum";
  let hasApprovedReport = false;
  let quotaRemaining = 3;
  let quotaTier: "freemium" | "premium" = "freemium";

  if (user) {
    const serviceClient = createServiceClient();

    // Profile'dan full_name çek — öncelik sırası:
    // 1. profiles.full_name'in ilk kelimesi
    // 2. email-prefix (fallback)
    // 3. "dostum" (son fallback)
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      firstName = profile.full_name.split(" ")[0];
    } else if (user.email) {
      firstName = user.email.split("@")[0];
    }

    // Onaylı rapor var mı?
    const { count } = await serviceClient
      .from("ai_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "approved");
    hasApprovedReport = (count ?? 0) > 0;

    // Mira quota durumu
    const quota = await getUserQuotaStatus(serviceClient, user.id);
    quotaRemaining = quota.remaining;
    quotaTier = quota.tier;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      {/* Welcome Section */}
      <div className="space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 bg-humanos-accent/10 border border-humanos-accent/30 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-humanos-accent rounded-full animate-pulse" />
          <span className="text-xs font-medium text-humanos-accent">
            BETA · Erken erişim
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-humanos-text">
          Hoş geldin, {firstName} 👋
        </h1>
        <p className="text-lg text-humanos-text-muted max-w-2xl">
          humanOS&apos;a katılmanın ilk günü. Şu an erken erişimdesin — birlikte
          inşa ediyoruz.
        </p>
      </div>

      {/* Conditional CTA stack — onaylı rapor varsa Mira primary, yoksa Yaşam Analizi primary */}
      {hasApprovedReport ? (
        <>
          <MiraChatCTA
            variant="primary"
            quotaRemaining={quotaRemaining}
            quotaTier={quotaTier}
            hasApprovedReport={true}
          />
          <YasamAnaliziCTA variant="secondary" alreadyDone={true} />
        </>
      ) : (
        <>
          <YasamAnaliziCTA variant="primary" alreadyDone={false} />
          <MiraChatCTA
            variant="secondary"
            quotaRemaining={quotaRemaining}
            quotaTier={quotaTier}
            hasApprovedReport={false}
          />
        </>
      )}

      {/* Roadmap Section */}
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-humanos-text">
          Yakında burada olacaklar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-4 p-4 bg-humanos-bg/50 border border-humanos-border/50 rounded-xl">
            <div className="text-2xl">🎯</div>
            <div>
              <h3 className="font-medium text-humanos-text mb-1">Hedefler</h3>
              <p className="text-sm text-humanos-text-muted">
                Enerji, form, odak — kendi standartlarını belirle.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-humanos-bg/50 border border-humanos-border/50 rounded-xl">
            <div className="text-2xl">📊</div>
            <div>
              <h3 className="font-medium text-humanos-text mb-1">
                Sağlık verilerin
              </h3>
              <p className="text-sm text-humanos-text-muted">
                Uyku, kalp atış, HRV — tek yerden gör.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-humanos-bg/50 border border-humanos-border/50 rounded-xl">
            <div className="text-2xl">💪</div>
            <div>
              <h3 className="font-medium text-humanos-text mb-1">
                Antrenman kayıtların
              </h3>
              <p className="text-sm text-humanos-text-muted">
                Güç, dayanıklılık, esneklik — hepsi bir ekranda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-humanos-bg/50 border border-humanos-border/50 rounded-xl">
            <div className="text-2xl">🧠</div>
            <div>
              <h3 className="font-medium text-humanos-text mb-1">
                Alışkanlık takibi
              </h3>
              <p className="text-sm text-humanos-text-muted">
                Sistemli ilerleme — günlük disiplin, haftalık analiz.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-humanos-border">
          <p className="text-sm text-humanos-text-subtle text-center">
            İlk sürümler önümüzdeki haftalarda. Sen buradaki en erken 100
            kişiden birisin.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CTA COMPONENTS
// ============================================================

function MiraChatCTA({
  variant,
  quotaRemaining,
  quotaTier,
  hasApprovedReport,
}: {
  variant: "primary" | "secondary";
  quotaRemaining: number;
  quotaTier: "freemium" | "premium";
  hasApprovedReport: boolean;
}) {
  const isPrimary = variant === "primary";

  // Açıklama metni — kullanıcı durumuna göre
  const description = hasApprovedReport
    ? "Onaylı raporun hazır — Mira ile derinlemesine konuş, soru sor, plan kur."
    : "humanOS'un yapay zeka tabanlı sesi. Sağlık, enerji, alışkanlık — anında konuşmaya başla.";

  // Quota label — soft urgency
  const quotaLabel =
    quotaTier === "premium"
      ? `Bu ay ${quotaRemaining} mesaj kaldı`
      : quotaRemaining > 0
        ? `${quotaRemaining} ücretsiz mesajın var`
        : "Premium'a geç";

  return (
    <Link
      href="/dashboard/chat"
      className={
        isPrimary
          ? "group block mb-6 bg-gradient-to-br from-humanos-accent/15 to-humanos-accent/5 border border-humanos-accent/40 hover:border-humanos-accent rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.01]"
          : "group block mb-10 bg-humanos-surface border border-humanos-border hover:border-humanos-accent/40 rounded-2xl p-5 md:p-6 transition-all"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={isPrimary ? "text-4xl" : "text-3xl"}>💬</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={
                  isPrimary
                    ? "text-xl md:text-2xl font-display font-semibold text-humanos-text"
                    : "text-lg md:text-xl font-display font-semibold text-humanos-text"
                }
              >
                Mira ile Sohbet
              </h2>
              {isPrimary && (
                <span className="inline-flex items-center gap-1 bg-humanos-accent/20 border border-humanos-accent/40 rounded-full px-2 py-0.5 text-xs font-medium text-humanos-accent">
                  Yeni
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-humanos-amber-soft border border-humanos-amber/30 rounded-full px-2 py-0.5 text-xs font-medium text-humanos-text-muted">
                {quotaLabel}
              </span>
            </div>
            <p
              className={
                isPrimary
                  ? "text-sm md:text-base text-humanos-text-muted leading-relaxed"
                  : "text-sm text-humanos-text-muted leading-relaxed"
              }
            >
              {description}
            </p>
          </div>
        </div>
        <div
          className={`text-2xl text-humanos-accent group-hover:translate-x-1 transition-transform shrink-0 hidden md:block ${
            isPrimary ? "" : "text-xl"
          }`}
        >
          →
        </div>
      </div>
    </Link>
  );
}

function YasamAnaliziCTA({
  variant,
  alreadyDone,
}: {
  variant: "primary" | "secondary";
  alreadyDone: boolean;
}) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href="/assessment/start"
      className={
        isPrimary
          ? "group block mb-10 bg-gradient-to-br from-humanos-accent/15 to-humanos-accent/5 border border-humanos-accent/40 hover:border-humanos-accent rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.01]"
          : "group block mb-10 bg-humanos-surface border border-humanos-border hover:border-humanos-accent/40 rounded-2xl p-5 md:p-6 transition-all"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={isPrimary ? "text-4xl" : "text-3xl"}>🧬</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={
                  isPrimary
                    ? "text-xl md:text-2xl font-display font-semibold text-humanos-text"
                    : "text-lg md:text-xl font-display font-semibold text-humanos-text"
                }
              >
                {alreadyDone ? "Yeni Analiz Başlat" : "Yaşam Analizine Başla"}
              </h2>
              {isPrimary && !alreadyDone && (
                <span className="inline-flex items-center gap-1 bg-humanos-accent/20 border border-humanos-accent/40 rounded-full px-2 py-0.5 text-xs font-medium text-humanos-accent">
                  Yeni
                </span>
              )}
            </div>
            <p
              className={
                isPrimary
                  ? "text-sm md:text-base text-humanos-text-muted leading-relaxed"
                  : "text-sm text-humanos-text-muted leading-relaxed"
              }
            >
              {alreadyDone
                ? "Yeni dönemde tekrar baktırmak istersen, yeni bir yaşam analizi başlatabilirsin."
                : "Beslenme, egzersiz, kan değerlerin ve alışkanlıkların — kişisel yaşam haritanı kur. ~10 dakika."}
            </p>
          </div>
        </div>
        <div className="text-2xl text-humanos-accent group-hover:translate-x-1 transition-transform shrink-0 hidden md:block">
          →
        </div>
      </div>
    </Link>
  );
}
