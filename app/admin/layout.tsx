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
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/admin');
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin(session.user.id, supabase);

  if (!userIsAdmin) {
    // Redirect non-admin users to home page
    redirect('/');
  }

  return <>{children}</>;
}

