import { createBrowserClient } from "@supabase/ssr";

/**
 * humanOS — Supabase Browser Client
 *
 * Tarayıcı tarafında (Client Components) kullanılır.
 * Kullanıcı oturum bilgisini cookie'den okur.
 *
 * Örnek kullanım:
 *   const supabase = createClient()
 *   const { data } = await supabase.auth.getUser()
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
