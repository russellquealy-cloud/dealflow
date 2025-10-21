import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreateListingForm from '@/components/CreateListingForm';

export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  console.log('🔐 New listing page - Starting authentication check...');
  
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log('🔐 New listing page - Session check:', { 
    hasSession: !!session, 
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
    userId: session?.user?.id,
    error: error?.message,
    errorCode: error?.code
  });
  
  if (error) {
    console.error('🔐 Session error:', error);
    console.log('🔐 Redirecting to login due to session error');
    redirect('/login?next=/my-listings/new');
  }
  
  if (!session || !session.user) {
    console.log('🔐 No session found, redirecting to login');
    redirect('/login?next=/my-listings/new');
  }
  
  console.log('🔐 Authentication successful, rendering page');

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing</h1>
      <CreateListingForm ownerId={session.user.id} />
    </main>
  );
}
