import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * humanOS — Authentication Middleware
 *
 * Her request'te çalışır:
 * 1. Supabase cookie'lerini okur
 * 2. Session token'ını gerekirse yeniler
 * 3. Güncellenmiş cookie'leri response'a yazar
 *
 * Next.js otomatik olarak bu dosyayı çağırır.
 * Manuel çağırmaya gerek yok.
 */
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
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

  // Session'ı yenile — kritik
  // Bu satır: token süresini kontrol eder, gerekirse yeniler
  await supabase.auth.getUser();

  return response;
}

/**
 * Middleware'in hangi route'larda çalışacağını belirtir.
 *
 * Hariç tutulan yollar (performans için):
 * - _next/static (JS/CSS asset'leri)
 * - _next/image (optimize edilmiş görseller)
 * - favicon.ico, sitemap.xml, robots.txt
 * - Görsel uzantılı dosyalar (svg, png, jpg, webp)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
