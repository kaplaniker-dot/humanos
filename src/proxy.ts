import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * humanOS — Authentication Middleware
 *
 * Her request'te çalışır ve 2 iş yapar:
 *
 * 1. Session Refresh (Day 3)
 *    - Supabase cookie'lerini okur
 *    - Token süresini kontrol eder, gerekirse yeniler
 *    - Güncellenmiş cookie'leri response'a yazar
 *    - KRİTİK: Cookie set ederken options'ı koru — PKCE flow bu cookie'lere bağımlı
 *
 * 2. Route Protection (Day 5)
 *    - Protected sayfalar (/dashboard): Session yoksa /sign-in'e yönlendir
 *    - Auth sayfalar (/sign-up, /sign-in): Session varsa /dashboard'a yönlendir
 *    - Public sayfalar (/): Herkese açık
 *
 * Not: /auth/callback bu middleware'den hariç tutuldu (matcher'da).
 * Çünkü PKCE flow'unda callback route handler'ın cookie'leri
 * kendi başına yönetmesi gerekir — middleware müdahalesi
 * exchangeCodeForSession'ı bozabilir.
 *
 * Next.js otomatik olarak bu dosyayı çağırır.
 */

// Route tanımları — tek yerde kontrol, kolay genişletme
const PROTECTED_ROUTES = ["/dashboard", "/profile", "/settings"];
const AUTH_ROUTES = ["/sign-up", "/sign-in"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // KRİTİK FIX: options'ı yaymayı unutma.
          // Eski kod ({ name, value } sadece) options'ı kaybediyordu,
          // bu da httpOnly/secure/sameSite/maxAge gibi
          // PKCE cookie'si için kritik ayarları sıfırlıyordu.
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Session Refresh — kritik
  // Bu satır: token süresini kontrol eder, gerekirse yeniler
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Route Protection
  const pathname = request.nextUrl.pathname;

  // 2a. Protected route + session yok → /sign-in'e yönlendir
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 2b. Auth route + session var → /dashboard'a yönlendir
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Diğer durumlar (public routes, izinli erişimler)
  return response;
}

/**
 * Middleware'in hangi route'larda çalışacağını belirtir.
 *
 * Hariç tutulan yollar (performans + PKCE flow için):
 * - _next/static (JS/CSS asset'leri)
 * - _next/image (optimize edilmiş görseller)
 * - favicon.ico, sitemap.xml, robots.txt
 * - auth/callback → PKCE code exchange için — middleware müdahale etmemeli
 * - Görsel uzantılı dosyalar (svg, png, jpg, webp)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
