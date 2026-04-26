"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * humanOS — Logout Button
 *
 * Client component — Supabase session'ı sonlandırır.
 * Başarılı logout sonrası /sign-in'e yönlendirir.
 *
 * Variants:
 * - "default" (varsayılan): Standalone buton, basit text link
 * - "menu-item": Dropdown menü item'ı stilinde (ikon + tam genişlik)
 *
 * Kullanım:
 *   <LogoutButton />                       — eski davranış
 *   <LogoutButton variant="menu-item" />   — UserMenuDropdown içinde
 */

type LogoutButtonProps = {
  variant?: "default" | "menu-item";
};

export default function LogoutButton({
  variant = "default",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("[Logout] Error:", error.message);
        setIsLoading(false);
        return;
      }

      console.log("[Logout] Success");
      // Sign-in sayfasına yönlendir + server component'leri yenile
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("[Logout] Unexpected error:", err);
      setIsLoading(false);
    }
  };

  // Menu Item Variant (dropdown içinde)
  if (variant === "menu-item") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-humanos-text hover:bg-humanos-bg/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-4 h-4 text-humanos-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span>{isLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}</span>
      </button>
    );
  }

  // Default Variant (standalone)
  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-sm text-humanos-text-muted hover:text-humanos-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {isLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </button>
  );
}
