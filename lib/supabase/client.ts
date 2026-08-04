import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase pro navegador (Client Components: telas de login/cadastro).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
