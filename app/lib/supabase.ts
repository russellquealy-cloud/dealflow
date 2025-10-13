// /app/lib/supabase.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseServer() {
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({
          name,
          value,
          path: "/",
          sameSite: "lax",
          secure,
          ...(options as CookieOptions),
        });
      },
      remove(name, options) {
        cookieStore.set({
          name,
          value: "",
          path: "/",
          sameSite: "lax",
          secure,
          ...(options as CookieOptions),
          expires: new Date(0),
        });
      },
    },
  });
}

// back-compat alias
export const createServerSupabase = createSupabaseServer;
