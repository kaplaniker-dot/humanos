import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

/**
 * humanOS — App Layout (Protected Routes)
 *
 * Tüm "giriş yapmış kullanıcı" sayfalarını sarar.
 * Server Component — cookies'ten session'ı direkt okur.
 *
 * İçerik:
 * - Nav bar (logo, email, logout)
 * - Main content area ({children})
 *
 * Protected route mantığı proxy.ts'de (middleware) — sonraki aşama.
 * Bu layout sadece UI sağlar, route korumasını yapmaz.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav Bar */}
      <header className="border-b border-humanos-border bg-humanos-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Sol: Logo */}
          <Link
            href="/dashboard"
            className="text-xl font-display font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-humanos-text">human</span>
            <span className="text-humanos-accent">OS</span>
          </Link>

          {/* Sağ: Kullanıcı Bilgisi + Logout */}
          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="text-sm text-humanos-text-muted hidden sm:inline">
                {user.email}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
