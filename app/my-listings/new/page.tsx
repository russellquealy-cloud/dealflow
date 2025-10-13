// /app/my-listings/new/page.tsx
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import CreateListingForm from "@/components/CreateListingForm";

const siteBg = "#fafafa";
const outer: React.CSSProperties = { background: siteBg, minHeight: "100vh" };
const wrap: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: 16 };

export default async function NewListingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/my-listings/new")}`);
  return (
    <main style={outer}>
      <div style={wrap}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Create Listing</h1>
        <CreateListingForm ownerId={user.id} />
      </div>
    </main>
  );
}
