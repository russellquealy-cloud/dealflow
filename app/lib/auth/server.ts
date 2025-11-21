// app/lib/auth/server.ts
import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// Using a generic type since Database type may not exist
// This can be refined later with proper Database types
type Database = Record<string, unknown>;

export function createSupabaseServerComponent() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

export function createSupabaseRouteClient() {
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
}

export async function getAuthUserServer() {
  const supabase = createSupabaseServerComponent();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null as const, error };
  }

  return { user, error: null };
}
