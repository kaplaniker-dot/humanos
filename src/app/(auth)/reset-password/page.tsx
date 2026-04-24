"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

/**
 * humanOS — Reset Password Page
 *
 * Şifre sıfırlama akışının 2. adımı.
 * URL: /reset-password
 * Layout: src/app/(auth)/layout.tsx
 *
 * Akış:
 * 1. Kullanıcı email'den callback üzerinden buraya düşer (login olmuş halde)
 * 2. useEffect session check yapar:
 *    - Session yok → /forgot-password'e yolla (yanlış URL)
 *    - Session var → form göster
 * 3. Kullanıcı yeni şifre + onay girer
 * 4. Zod validation (6+ karakter, eşleşme kontrolü)
 * 5. Supabase updateUser({ password }) ile şifre değiştirilir
 * 6. Başarı → /dashboard'a redirect
 *
 * Üç ekran durumu:
 * - isCheckingSession === true  → "Oturum kontrol ediliyor..." loading
 * - isCheckingSession === false → Form görünümü
 * - (Session yoksa zaten redirect olur, bu component hiç render etmez)
 */

// Zod schema — iki şifre + eşleşme kontrolü
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Şifre en az 6 karakter olmalı")
      .max(72, "Şifre 72 karakterden uzun olamaz"),
    confirmPassword: z.string().min(1, "Şifreni tekrar gir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();

  // Session state
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Sayfa yüklenince session kontrolü yap.
   * - Session yok → /forgot-password'e redirect (yanlış URL)
   * - Session var → form göster
   */
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Kullanıcı direkt URL'e gelmiş veya session geçersiz
        router.push("/forgot-password");
        return;
      }

      // Session geçerli — form göster
      setIsCheckingSession(false);
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Önceki hatayı temizle
    setErrorMessage("");

    // 2. Zod validation
    const validation = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    // 3. Loading state
    setIsLoading(true);

    try {
      // 4. Supabase'e şifre güncelleme isteği
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("[Reset Password] Supabase error:", error.message);
        setErrorMessage(translateSupabaseError(error.message));
        return;
      }

      // 5. Başarılı — dashboard'a yönlendir
      console.log("[Reset Password] Success!");
      router.push("/dashboard");
    } catch (err) {
      console.error("[Reset Password] Unexpected error:", err);
      setErrorMessage("Bir şeyler ters gitti. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOADING STATE ---
  if (isCheckingSession) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-humanos-text">
            Oturum kontrol ediliyor...
          </h1>
          <p className="text-humanos-text-muted">
            Bir saniye sürer.
          </p>
        </div>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-humanos-text">
          Yeni şifreni belirle
        </h1>
        <p className="text-humanos-text-muted">
          Güçlü bir şifre seç — en az 6 karakter.
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

          {/* Yeni Şifre Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-humanos-text"
            >
              Yeni Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-humanos-text-subtle">En az 6 karakter</p>
          </div>

          {/* Şifre Onay Input */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-humanos-text"
            >
              Şifreyi Tekrarla
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-humanos-bg border border-humanos-border rounded-lg text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-humanos-accent hover:bg-humanos-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-humanos-bg font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir →"}
          </button>
        </form>

        {/* Ayırıcı */}
        <div className="border-t border-humanos-border" />

        {/* Alt link */}
        <p className="text-sm text-humanos-text-muted text-center">
          <Link
            href="/dashboard"
            className="text-humanos-accent hover:text-humanos-accent-hover transition-colors font-medium"
          >
            ← Dashboard&apos;a dön
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Supabase hata mesajlarını Türkçe'ye çevir.
 */
function translateSupabaseError(message: string): string {
  if (message.includes("Password should be")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (message.includes("New password should be different")) {
    return "Yeni şifren eskisiyle aynı olamaz.";
  }
  if (message.includes("Auth session missing")) {
    return "Oturumun sona ermiş. Lütfen şifre sıfırlamayı tekrar başlat.";
  }
  // Bilinmeyen hata
  return message;
}
