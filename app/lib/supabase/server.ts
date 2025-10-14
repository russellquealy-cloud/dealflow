import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // In some Next versions, cookies() types as Promise; at runtime it's sync here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store: any = cookies();
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store: any = cookies();
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store: any = cookies();
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}
