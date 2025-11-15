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
      redirect('/login');
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id, supabase);

    if (!userIsAdmin) {
      // User is logged in but not admin - redirect to listings
      // Use absolute redirect to break any potential loops
      console.warn(`User ${session.user.email} attempted to access admin but is not admin. Redirecting to listings.`);
      redirect('/listings');
    }

    // User is admin - allow access
    return <>{children}</>;
  } catch (error) {
    // On any error, redirect to listings to be safe
    console.error('Admin layout error:', error);
    redirect('/listings');
  }
}

