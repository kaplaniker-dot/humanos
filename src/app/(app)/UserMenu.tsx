import { createClient } from "@/lib/supabase/server";
import UserMenuDropdown from "./UserMenuDropdown";

/**
 * humanOS — UserMenu (Server Component)
 *
 * Sağ üst köşedeki kullanıcı menüsü.
 * Server tarafında profile fetch eder, initial üretir.
 * Client component (UserMenuDropdown) wrap eder.
 *
 * Mimari:
 * - Server: Veri fetch (full_name, email)
 * - Client: Dropdown state + UI etkileşimi
 *
 * Initial üretim mantığı:
 * - full_name varsa: "İlker Kaplan" → "İK"
 * - full_name yoksa: email "ahmet@gmail.com" → "A"
 */

type UserMenuProfile = {
  full_name: string | null;
};

export default async function UserMenu() {
  const supabase = await createClient();

  // 1. User'ı al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensive — layout zaten user'ı varsayar ama yine de kontrol
  if (!user) {
    return null;
  }

  // 2. Profile'ı çek (sadece full_name lazım)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<UserMenuProfile>();

  // 3. Initial ve görünen isim üret
  const fullName = profile?.full_name ?? null;
  const email = user.email ?? "";

  const initial = generateInitial(fullName, email);
  const displayName = fullName || email;

  return (
    <UserMenuDropdown
      initial={initial}
      displayName={displayName}
      email={email}
    />
  );
}

/**
 * Initial üretici — kullanıcının iki harflik kısaltması.
 *
 * Mantık:
 * - "İlker Kaplan" → "İK" (her kelimenin ilk harfi)
 * - "İlker" → "İ" (tek kelime)
 * - "" + email → email'in ilk harfi büyük
 */
function generateInitial(fullName: string | null, email: string): string {
  // 1. Full name doluysa
  if (fullName && fullName.trim().length > 0) {
    const words = fullName.trim().split(/\s+/);

    if (words.length >= 2) {
      // "İlker Kaplan" → "İK"
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    // Tek kelime: "İlker" → "İ"
    return words[0][0].toUpperCase();
  }

  // 2. Fallback: email
  if (email.length > 0) {
    return email[0].toUpperCase();
  }

  // 3. Son çare
  return "?";
}
