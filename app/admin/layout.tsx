import { redirect } from 'next/navigation';
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
  try {
    const supabase = await createSupabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If no session, redirect to login (once, not a loop)
    if (sessionError || !session) {
      redirect('/login?next=' + encodeURIComponent('/admin'));
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id, supabase);

    // If not admin, show forbidden (don't redirect to login - that causes loops)
    if (!userIsAdmin) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
            <p style={{ marginBottom: '24px', fontSize: '18px' }}>
              Admin access required. You are logged in as {session.user.email}, but your account does not have admin privileges.
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              If you believe you should have admin access, please contact support.
            </p>
          </div>
        </div>
      );
    }

    // User is admin - allow access
    return <>{children}</>;
  } catch (error) {
    // On error, redirect to login (safer than showing admin content)
    console.error('Admin layout error:', error);
    redirect('/login?next=' + encodeURIComponent('/admin'));
  }
}

