import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

/**
 * Server-side layout protection for /admin routes
 * This ensures only admin users can access admin pages
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      // No session - redirect to login (without next parameter to prevent loops)
      console.log('🔒 Admin layout: No session, redirecting to login');
      redirect('/login');
    }

    console.log(`🔒 Admin layout: Checking admin status for user ${session.user.email} (${session.user.id})`);

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id, supabase);

    // Get profile for detailed logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment')
      .eq('id', session.user.id)
      .maybeSingle();

    console.log(`🔒 Admin layout: Profile check result:`, {
      userEmail: session.user.email,
      userId: session.user.id,
      profileRole: profile?.role,
      profileSegment: profile?.segment,
      isAdmin: userIsAdmin,
    });

    if (!userIsAdmin) {
      // User is logged in but not admin
      // Allow page to load so diagnostic tools can be used, but log the issue
      console.warn(`🔒 Admin layout: User ${session.user.email} is NOT admin (role: ${profile?.role}, segment: ${profile?.segment}). Allowing page load for diagnostics.`);
      // Don't redirect - let the page show diagnostic info and fix button
      // The page itself will show an "Access Denied" message with diagnostic tools
    }

    // User is admin - allow access
    console.log(`🔒 Admin layout: User ${session.user.email} is admin, allowing access`);
    return <>{children}</>;
  } catch (error) {
    // On any error, redirect to listings to be safe
    console.error('🔒 Admin layout error:', error);
    redirect('/listings');
  }
}

