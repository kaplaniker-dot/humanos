"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — Sign-in Page
 *
 * Varolan kullanıcıların giriş akışı.
 * URL: /sign-in
 * Layout: src/app/(auth)/layout.tsx (paylaşılan)
 *
 * Güvenlik Notu: Email/şifre ayrımı YAPILMAZ.
 * Tüm hatalar "E-posta veya şifre yanlış" olarak gösterilir.
 * Bu, email enumeration saldırılarına karşı savunma.
 *
 * İstisna: "Email not confirmed" hatası özel mesajla gösterilir.
 * Bu hata ancak doğru email+şifre kombinasyonunda döner —
 * yani saldırgan bu sinyali normal şekilde alamaz.
 * Gerçek kullanıcılar için önemli bir UX iyileştirmesi.
 */

// Zod schema — sadece "boş değil" kontrolü
// Gerçek validation Supabase'de (şifre zaten kayıtlı, uzunluğu öyle)
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta gerekli")
    .email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export default function SignInPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Form submit handler
   * 1. Önceki hatayı temizle
   * 2. Zod ile basit validate et (boş mu, email formatı mı)
   * 3. Supabase'e signInWithPassword isteği at
   * 4. Hata varsa generic mesaj göster (güvenlik)
   * 5. Başarılı ise ana sayfaya yönlendir
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    // 1. Zod validation
    const validation = signInSchema.safeParse({ email, password });

    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      setErrorMessage(firstError);
      return;
    }

    // 2. Loading aç
    setIsLoading(true);

    try {
      // 3. Supabase signIn isteği
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 4a. Hata — generic mesaj (güvenlik)
      if (error) {
        console.error("[Sign-in] Supabase error:", error.message);
        setErrorMessage(translateSignInError(error.message));
        return;
      }

      // 4b. Başarılı — kullanıcı giriş yaptı
      console.log("[Sign-in] Success! User ID:", data.user?.id);

      // Ana sayfaya yönlendir
      // (İlerde: /dashboard'a yönlendireceğiz)
      router.push("/dashboard");
      router.refresh(); // Server component'leri yeniden render et
    } catch (err) {
      console.error("[Sign-in] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Başlık Bölümü */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Tekrar hoş geldin
        </h1>
        <p className="text-humanos-text-muted">
          humanOS&apos;a devam et.
        </p>
      </div>

      {/* Form Kartı */}
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Box */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-humanos-text"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sen@ornek.com"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Şifre Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-humanos-text"
              >
                Şifre
              </label>
              {/* Şifremi unuttum - /forgot-password sayfasına yönlendirir */}
              <Link
                href="/forgot-password"
                className="text-xs text-humanos-text-subtle hover:text-humanos-accent transition-colors"
              >
                Şifremi unuttum?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Giriş Yap Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap →"}
          </button>
        </form>

        {/* Ayırıcı Çizgi */}
        <div className="border-t border-humanos-border" />

        {/* Kayıt Ol Linki */}
        <p className="text-sm text-humanos-text-muted text-center">
          Hesabın yok mu?{" "}
          <Link
            href="/sign-up"
            className="text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Supabase sign-in hata mesajlarını Türkçe'ye çevir.
 *
 * Güvenlik stratejisi:
 * - Çoğu hata generic "e-posta veya şifre yanlış" olarak döner
 *   (email enumeration saldırılarına karşı savunma)
 * - İstisna: "Email not confirmed" özel mesaj — bu hata ancak
 *   doğru email+şifre kombinasyonunda döner, yani saldırgan
 *   bu sinyali normal şekilde alamaz. Gerçek kullanıcıya
 *   doğru yönü göstermek için özel mesaj kullanıyoruz.
 */
function translateSignInError(message: string): string {
  // Özel durum: Email doğrulanmamış
  // Sıra kritik — bu kontrol "invalid" kontrolünden ÖNCE gelmeli
  if (message.includes("Email not confirmed")) {
    return "E-postanı henüz doğrulamadın. Inbox'ını kontrol et — bağlantıya tıklaman yeterli.";
  }

  // Genel: Yanlış kimlik bilgileri
  if (
    message.includes("Invalid login credentials") ||
    message.includes("invalid")
  ) {
    return "E-posta veya şifre yanlış.";
  }

  // Rate limit
  if (message.includes("rate limit") || message.includes("Email rate limit")) {
    return "Çok fazla deneme. Lütfen birkaç dakika bekle.";
  }

  // Genel hata (beklenmedik)
  return "Giriş yapılamadı. Lütfen tekrar dene.";
}
