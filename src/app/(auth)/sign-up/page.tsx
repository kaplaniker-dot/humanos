"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — Sign-up Page
 *
 * İlk kullanıcı etkileşimi — kayıt akışı.
 * URL: /sign-up
 * Layout: src/app/(auth)/layout.tsx
 *
 * Katman 2 — Mini-Adım 4: Supabase entegrasyonu
 * - useState ile form state yönetimi ✅
 * - Input'lar state'e bağlı ✅
 * - Zod validation ✅
 * - Error box gösterimi ✅
 * - Supabase auth.signUp() ✅ (GERÇEK AUTH)
 * - emailRedirectTo: /auth/callback üzerinden dashboard'a PKCE flow ✅
 * - Loading state ✅
 * - Success state ✅ (AŞAMA 7 — "E-postanı kontrol et")
 *
 * UX Akışı (Day 7 sonrası):
 * 1. Kullanıcı form doldurur
 * 2. Zod validation + Supabase signUp
 * 3. Başarılı ise → isSuccess=true → Success view render olur
 *    (router.push KALDIRILDI — eskiden /dashboard'a gidiyordu,
 *     ama email doğrulanmamış olduğu için proxy sign-in'e atıyordu.
 *     Bug 2 Day 6 — ÇÖZÜLDÜ)
 * 4. Kullanıcı email'ini kontrol eder, bağlantıya tıklar
 * 5. /auth/callback üzerinden /dashboard'a login olmuş halde varır
 */

// Zod schema — form validation kuralları
const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta gerekli")
    .email("Geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalı")
    .max(72, "Şifre 72 karakterden uzun olamaz"),
});

export default function SignUpPage() {
  const router = useRouter();

  // Form state - 5 değişken
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Form submit handler
   * 1. Önceki hatayı temizle
   * 2. Zod ile validate et
   * 3. Geçersizse hatayı göster ve dur
   * 4. Loading state aç
   * 5. Supabase'e kayıt isteği at
   * 6. Hata varsa göster, başarılıysa success state'e geç
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Önceki hatayı temizle
    setErrorMessage("");

    // 2. Zod ile validate et
    const validation = signUpSchema.safeParse({ email, password });

    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      setErrorMessage(firstError);
      return;
    }

    // 4. Loading state aç
    setIsLoading(true);

    try {
      // 5. Supabase'e kayıt isteği at
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Email doğrulama linkine tıklanınca nereye yönlenilecek.
          // PKCE flow:
          //   1. Kullanıcı buraya (/auth/callback) düşer
          //   2. Route handler code'u session'a çevirir
          //   3. Sonra ?next= değerine yönlendirir
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      // 6a. Supabase hatası varsa
      if (error) {
        console.error("[Sign-up] Supabase error:", error.message);
        setErrorMessage(translateSupabaseError(error.message));
        return;
      }

      // 6b. Başarılı — kullanıcı oluştu, email yolda
      console.log("[Sign-up] Success! User ID:", data.user?.id);

      // Success view'e geç — router.push yok, aynı sayfadayız
      setIsSuccess(true);
    } catch (err) {
      // Beklenmedik hata (network, vs.)
      console.error("[Sign-up] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
    } finally {
      // 7. Her durumda loading'i kapat
      setIsLoading(false);
    }
  };

  // --- SUCCESS STATE GÖRÜNÜMÜ ---
  // Kayıt başarılı — form gizlenir, "E-postanı kontrol et" mesajı çıkar
  if (isSuccess) {
    return (
      <div className="space-y-8">
        {/* Başlık */}
        <div className="space-y-2 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
            Hesabın oluşturuldu
          </h1>
          <p className="text-humanos-text-muted">
            Son bir adım kaldı — e-postanı doğrula.
          </p>
        </div>

        {/* Bilgi Kartı */}
        <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-4">
          <p className="text-sm text-humanos-text-muted leading-relaxed">
            <span className="text-humanos-text font-medium">{email}</span>{" "}
            adresine bir doğrulama bağlantısı gönderdik. E-postandaki butona
            tıklayarak hesabını aktive edebilir ve humanOS&apos;a
            başlayabilirsin.
          </p>

          <div className="bg-humanos-bg border border-humanos-border rounded-lg px-4 py-3">
            <p className="text-xs text-humanos-text-subtle leading-relaxed">
              💡 E-postayı göremiyorsan{" "}
              <strong className="text-humanos-text-muted">Spam</strong>{" "}
              klasörüne bakmayı unutma. Bağlantı{" "}
              <strong className="text-humanos-text-muted">24 saat</strong>{" "}
              içinde geçerlidir.
            </p>
          </div>
        </div>

        {/* Giriş Yap Linki */}
        <p className="text-sm text-humanos-text-muted text-center">
          <Link
            href="/sign-in"
            className="text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            ← Giriş sayfasına dön
          </Link>
        </p>
      </div>
    );
  }

  // --- FORM GÖRÜNÜMÜ ---
  return (
    <div className="space-y-8">
      {/* Başlık Bölümü */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Hoş geldin
        </h1>
        <p className="text-humanos-text-muted">
          humanOS&apos;a katılmaya hazır ol.
        </p>
      </div>

      {/* Form Kartı */}
      <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Box — sadece errorMessage varsa görünür */}
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
            />
          </div>

          {/* Şifre Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-humanos-text"
            >
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
            />
            <p className="text-xs text-humanos-text-subtle">En az 6 karakter</p>
          </div>

          {/* Kayıt Ol Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "Kaydediliyor..." : "Kayıt Ol →"}
          </button>
        </form>

        {/* Ayırıcı Çizgi */}
        <div className="border-t border-humanos-border" />

        {/* Giriş Yap Linki */}
        <p className="text-sm text-humanos-text-muted text-center">
          Zaten hesabın var mı?{" "}
          <Link
            href="/sign-in"
            className="text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            Giriş yap
          </Link>
        </p>
      </div>

      {/* Alt Bilgi */}
      <p className="text-xs text-humanos-text-subtle text-center px-4">
        Kayıt olarak humanOS&apos;un{" "}
        <span className="text-humanos-text-muted">Kullanım Şartları</span>
        {" ve "}
        <span className="text-humanos-text-muted">Gizlilik Politikası</span>
        &apos;nı kabul etmiş olursun.
      </p>
    </div>
  );
}

/**
 * Supabase hata mesajlarını Türkçe'ye çevir.
 * Kullanıcı dostu, anlaşılır mesajlar.
 */
function translateSupabaseError(message: string): string {
  // En sık karşılaşılan hatalar
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  }
  if (message.includes("invalid") && message.includes("email")) {
    return "Geçersiz e-posta adresi.";
  }
  if (message.includes("Password should be")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (message.includes("Email rate limit exceeded")) {
    return "Çok fazla deneme. Lütfen birkaç dakika bekle.";
  }
  // Bilinmeyen hata — orijinali göster
  return message;
}
