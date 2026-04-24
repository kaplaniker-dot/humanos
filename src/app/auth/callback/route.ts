import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * humanOS — Auth Callback Route Handler
 *
 * URL: /auth/callback
 *
 * Bu endpoint, Supabase'in email doğrulama / password reset
 * linklerinde kullanıcıyı yönlendirdiği ara durak.
 *
 * Akış:
 * 1. Email linkine tıklanır
 * 2. Supabase token'ı doğrular, tarayıcıyı buraya yollar
 *    (URL'de ?code=... parametresi ile)
 * 3. Burada code'u session'a çeviririz (exchangeCodeForSession)
 * 4. Session cookie'leri atanır → kullanıcı login olur
 * 5. next parametresine (veya default /dashboard'a) yönlendiririz
 *
 * Hata durumunda:
 * - Code yok → /sign-in?error=auth_callback_error
 * - Exchange fail → /sign-in?error=auth_callback_error
 *
 * Not: Bu bir "Route Handler" — UI yok, sadece işlem + redirect.
 * Supabase PKCE flow'u için zorunlu bir parça.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Email linkinden gelen doğrulama kodu
  const code = searchParams.get("code");

  // Doğrulama sonrası nereye yönlenilecek
  // Default: /dashboard (sign-up doğrulama için)
  // Esneklik: Password reset flow'unda "next=/reset-password" gelebilir
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Kodu session'a çevir — başarılıysa cookie'ler otomatik atanır
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("[Auth Callback] Success — redirecting to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Exchange başarısız — token süresi geçmiş, bozuk, vs.
    console.error("[Auth Callback] Exchange error:", error.message);
  } else {
    console.error("[Auth Callback] No code in URL");
  }

  // Herhangi bir hata durumunda sign-in'e at
  return NextResponse.redirect(
    `${origin}/sign-in?error=auth_callback_error`
  );
}
