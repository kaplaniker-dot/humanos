import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * humanOS — Dashboard Page
 *
 * Giriş yapmış kullanıcının ana sayfası.
 * URL: /dashboard
 *
 * Layout:
 * 1. Welcome Section (hoş geldin + BETA badge)
 * 2. Yaşam Analizi CTA — şu an aktif tek özellik (prominent)
 * 3. Roadmap Section (gelecek özellikler)
 *
 * Server Component — kullanıcı bilgisini cookies'ten okur.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.email?.split("@")[0] ?? "dostum";

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

      {/* Yaşam Analizi CTA — prominent */}
      <Link
        href="/assessment/start"
        className="group block mb-10 bg-gradient-to-br from-humanos-accent/15 to-humanos-accent/5 border border-humanos-accent/40 hover:border-humanos-accent rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.01]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="text-4xl">🧬</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-display font-semibold text-humanos-text">
                  Yaşam Analizine Başla
                </h2>
                <span className="inline-flex items-center gap-1 bg-humanos-accent/20 border border-humanos-accent/40 rounded-full px-2 py-0.5 text-xs font-medium text-humanos-accent">
                  Yeni
                </span>
              </div>
              <p className="text-sm md:text-base text-humanos-text-muted leading-relaxed">
                Beslenme, egzersiz, kan değerlerin ve alışkanlıkların — kişisel
                yaşam haritanı kur. ~10 dakika.
              </p>
            </div>
          </div>
          <div className="text-2xl text-humanos-accent group-hover:translate-x-1 transition-transform shrink-0 hidden md:block">
            →
          </div>
        </div>
      </Link>

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
