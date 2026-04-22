import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * humanOS — Landing Page
 *
 * Server Component — session durumuna göre akıllı CTA.
 *
 * Giriş yapmamış ziyaretçi → "Erken Erişim Al →" (/sign-up)
 * Giriş yapmış kullanıcı    → "Dashboard'a Git →" (/dashboard)
 *
 * Defensive UX: Kullanıcı nerede olduğunu bilir, ne yapacağını görür.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session'a göre dinamik CTA
  const isLoggedIn = !!user;
  const ctaText = isLoggedIn ? "Dashboard'a Git" : "Erken Erişim Al";
  const ctaHref = isLoggedIn ? "/dashboard" : "/sign-up";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* Beta Pill */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-humanos-border bg-humanos-surface px-4 py-1.5 text-xs font-medium text-humanos-text-muted">
        <span className="h-2 w-2 rounded-full bg-humanos-accent"></span>
        BETA · Erken erişim açıldı
      </div>
      {/* Main Heading */}
      <h1 className="text-center text-6xl font-bold tracking-tight text-humanos-text sm:text-7xl md:text-8xl">
        human<span className="text-humanos-accent">OS</span>
      </h1>
      {/* Tagline */}
      <p className="mt-8 max-w-2xl text-center text-lg leading-relaxed text-humanos-text-muted sm:text-xl md:text-2xl">
        Enerjin, odağın ve uzun ömrün için{" "}
        <span className="text-humanos-text">bilim destekli işletim sistemi.</span>
      </p>
      {/* CTA Button */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2 rounded-lg bg-humanos-accent px-8 py-4 text-base font-semibold text-humanos-bg transition-all hover:bg-humanos-accent-hover hover:shadow-lg hover:shadow-humanos-accent-glow"
        >
          {ctaText}
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
        <p className="text-sm text-humanos-text-subtle">
          Bilim destekli · Founding Member Programı
        </p>
      </div>
    </main>
  );
}
