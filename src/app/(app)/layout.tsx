import Link from "next/link";
import UserMenu from "./UserMenu";

/**
 * humanOS — App Layout (Protected Routes)
 *
 * Tüm "giriş yapmış kullanıcı" sayfalarını sarar.
 *
 * İçerik:
 * - Nav bar (logo, UserMenu dropdown)
 * - Main content area ({children})
 *
 * Protected route mantığı proxy.ts'de (middleware).
 * Bu layout sadece UI sağlar, route korumasını yapmaz.
 *
 * Day 8 değişikliği:
 * - Email + LogoutButton ayrı elementler → tek UserMenu dropdown
 * - User bilgisi UserMenu içinde fetch ediliyor (server-side)
 */

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

          {/* Sağ: User Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
