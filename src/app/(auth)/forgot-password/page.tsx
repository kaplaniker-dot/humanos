"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — Forgot Password Page
 *
 * Şifre sıfırlama akışının 1. adımı.
 * URL: /forgot-password
 * Layout: src/app/(auth)/layout.tsx
 *
 * Akış:
 * 1. Kullanıcı email'ini girer
 * 2. Zod validation
 * 3. Supabase resetPasswordForEmail çağrılır (PKCE flow)
 * 4. Email var olsa da olmasa da BAŞARI mesajı gösterilir
 *    (güvenlik: email enumeration attack'ı engelle)
 * 5. Supabase, kullanıcıya Reset Password email'i yollar
 * 6. Kullanıcı email'deki linke tıklar → /auth/callback
 *    → callback exchange yapar → /reset-password sayfasına yönlenir
 *
 * State machine:
 * - isSuccess === false → Form görünümü
 * - isSuccess === true  → Success mesajı görünümü (form gizlenir)
 */

// Zod schema — sadece email validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta gerekli")
    .email("Geçerli bir e-posta adresi girin"),
});

export default function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Önceki hatayı temizle
    setErrorMessage("");

    // 2. Zod validation
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    // 3. Loading state
    setIsLoading(true);

    try {
      // 4. Supabase'e şifre sıfırlama isteği
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Email linkine basınca buraya düşecek.
        // PKCE flow: callback handler code'u exchange edip /reset-password'a yönlenir.
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      // 5. Güvenlik notu:
      // Email sistemde yoksa bile KULLANICIYA HATA GÖSTERMEYİZ.
      // "Email bulunamadı" mesajı email enumeration attack'a izin verir.
      // Her durumda aynı success state'i gösteririz.
      if (error) {
        // Log'a yaz (biz görelim), kullanıcıya gösterme
        console.error("[Forgot Password] Supabase error:", error.message);
      }

      // 6. Her durumda success state'e geç
      setIsSuccess(true);
    } catch (err) {
      // Ancak network / unexpected error'da kullanıcıya bilgi ver
      console.error("[Forgot Password] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUCCESS STATE GÖRÜNÜMÜ ---
  if (isSuccess) {
    return (
      <div className="space-y-8">
        {/* Başlık */}
        <div className="space-y-2 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
            E-postanı kontrol et
          </h1>
          <p className="text-humanos-text-muted">
            Hesabın varsa birazdan bir bağlantı alacaksın.
          </p>
        </div>

        {/* Bilgi Kartı */}
        <div className="bg-humanos-surface border border-humanos-border rounded-2xl p-6 md:p-8 space-y-4">
          <p className="text-sm text-humanos-text-muted leading-relaxed">
            <span className="text-humanos-text font-medium">{email}</span>{" "}
            adresine şifre sıfırlama bağlantısı gönderdik. E-postandaki butona
            tıklayarak yeni bir şifre oluşturabilirsin.
          </p>

          <div className="bg-humanos-bg border border-humanos-border rounded-lg px-4 py-3">
            <p className="text-xs text-humanos-text-subtle leading-relaxed">
              💡 E-postayı göremiyorsan <strong className="text-humanos-text-muted">Spam</strong> klasörüne bakmayı unutma.
              Bağlantı <strong className="text-humanos-text-muted">1 saat</strong> içinde geçerlidir.
            </p>
          </div>
        </div>

        {/* Geri dön */}
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
      {/* Başlık */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Şifreni mi unuttun?
        </h1>
        <p className="text-humanos-text-muted">
          Sorun değil — sana yeni bir bağlantı gönderelim.
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
            />
            <p className="text-xs text-humanos-text-subtle">
              Hesabına kayıtlı e-posta adresi
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "Gönderiliyor..." : "Bağlantı Gönder →"}
          </button>
        </form>

        {/* Ayırıcı */}
        <div className="border-t border-humanos-border" />

        {/* Alt link */}
        <p className="text-sm text-humanos-text-muted text-center">
          <Link
            href="/sign-in"
            className="text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            ← Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
