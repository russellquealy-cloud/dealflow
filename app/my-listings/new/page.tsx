import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreateListingForm from '@/components/CreateListingForm';

export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log('New listing page - Session check:', { 
    hasSession: !!session, 
    hasUser: !!session?.user, 
    error: error?.message 
  });
  
  if (error) {
    console.error('Session error:', error);
    redirect('/login?next=/my-listings/new');
  }
  
  if (!session || !session.user) {
    console.log('No session found, redirecting to login');
    redirect('/login?next=/my-listings/new');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing</h1>
      <CreateListingForm ownerId={session.user.id} />
    </main>
  );
}
