import { cookies } from "next/headers";

import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

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
    return { user: null, error };
  }

  return { user, error: null };
}
