import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreateListingForm from '@/components/CreateListingForm';

export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/my-listings/new');

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing</h1>
      <CreateListingForm ownerId={session.user.id} />
    </main>
  );
}
