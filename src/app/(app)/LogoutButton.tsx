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
 * Kullanım: <LogoutButton /> — herhangi bir layout/page'de
 */
export default function LogoutButton() {
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
