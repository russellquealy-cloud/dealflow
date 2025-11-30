import { createSupabaseServerComponent } from "@/lib/auth/server";

export async function createServerClient() {
  return createSupabaseServerComponent();
}
