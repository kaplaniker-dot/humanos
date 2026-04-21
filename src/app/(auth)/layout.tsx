import Link from "next/link";

/**
 * humanOS — Auth Layout
 *
 * Tüm auth sayfalarını (sign-up, sign-in, forgot-password)
 * sarar. Minimalist tasarım — sadece logo + içerik.
 *
 * Root layout'tan miras alınan özellikler:
 * - Inter + Inter Tight fontları
 * - Dark mode (bg-humanos-bg)
 * - Brand renk tokenları
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Üst: Logo */}
      <header className="p-6 md:p-8">
        <Link
          href="/"
          className="inline-block text-2xl font-display font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="text-humanos-text">human</span>
          <span className="text-humanos-accent">OS</span>
        </Link>
      </header>

      {/* Orta: Form Container */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
