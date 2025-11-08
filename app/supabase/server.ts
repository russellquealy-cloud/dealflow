import { getSupabaseServer } from "@/lib/auth/server";

export async function createServerClient() {
  return getSupabaseServer();
}
