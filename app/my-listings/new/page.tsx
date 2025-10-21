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
  
  // TEMPORARY: Check if we're in development and bypass auth for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const bypassAuth = process.env.BYPASS_AUTH === 'true';
  
  if (error) {
    console.error('🔐 Session error:', error);
    if (isDevelopment && bypassAuth) {
      console.log('🔐 Development bypass: Continuing despite session error');
    } else {
      console.log('🔐 Redirecting to login due to session error');
      redirect('/login?next=/my-listings/new');
    }
  }
  
  if (!session || !session.user) {
    if (isDevelopment && bypassAuth) {
      console.log('🔐 Development bypass: Continuing without session');
      // Use a dummy user ID for development
      const dummyUserId = 'dev-user-123';
      return (
        <main style={{ padding: 24 }}>
          <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing (Development Mode)</h1>
          <CreateListingForm ownerId={dummyUserId} />
        </main>
      );
    } else {
      console.log('🔐 No session found, redirecting to login');
      redirect('/login?next=/my-listings/new');
    }
  }
  
  console.log('🔐 Authentication successful, rendering page');

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Create Listing</h1>
      <CreateListingForm ownerId={session.user.id} />
    </main>
  );
}
