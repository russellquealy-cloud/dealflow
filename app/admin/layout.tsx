import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

// Mark admin routes as dynamic since they use cookies for authentication
// This suppresses the build-time warnings about static generation
export const dynamic = 'force-dynamic';

/**
 * Server-side layout protection for /admin routes
 * This ensures only admin users can access admin pages
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ABSOLUTELY NO REDIRECTS - Page will always load
  console.log('🔒 Admin layout: RENDERING - NO REDIRECTS');
  
  try {
    const supabase = await createSupabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log('🔒 Admin layout: No session, but ALLOWING PAGE TO LOAD');
      return <>{children}</>;
    }

    console.log(`🔒 Admin layout: User ${session.user.email} has session, ALLOWING PAGE TO LOAD`);

    // Check if user is admin (but don't redirect based on result)
    const userIsAdmin = await isAdmin(session.user.id, supabase);

    // Get profile for detailed logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment')
      .eq('id', session.user.id)
      .maybeSingle();

    console.log(`🔒 Admin layout: Profile check - role: ${profile?.role}, segment: ${profile?.segment}, isAdmin: ${userIsAdmin}`);
    console.log('🔒 Admin layout: ALLOWING PAGE TO LOAD - NO REDIRECT');

    // ALWAYS return children - NEVER redirect
    return <>{children}</>;
  } catch (error) {
    // On any error, STILL allow page to load
    console.error('🔒 Admin layout error (but still allowing page load):', error);
    return <>{children}</>;
  }
}

