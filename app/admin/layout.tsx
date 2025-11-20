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
    
    // Try getUser first (more reliable than getSession in some cases)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('Admin layout: getUser failed, trying getSession', { 
        error: userError?.message,
        hasUser: !!user 
      });
      
      // Fallback to getSession if getUser fails
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log('Admin layout: No session found, redirecting to login', {
          sessionError: sessionError?.message,
          hasSession: !!session
        });
        redirect('/login?next=' + encodeURIComponent('/admin'));
      }
      
      // Use session user if getUser failed
      const sessionUser = session.user;
      console.log('Admin layout: Using session user', { 
        userId: sessionUser.id, 
        email: sessionUser.email 
      });
      
      const userIsAdmin = await isAdmin(sessionUser.id, supabase);
      console.log('Admin layout: isAdmin check result', { 
        userId: sessionUser.id, 
        isAdmin: userIsAdmin 
      });
      
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
                Admin access required. You are logged in as {sessionUser.email}, but your account does not have admin privileges.
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                If you believe you should have admin access, please contact support.
              </p>
            </div>
          </div>
        );
      }
      return <>{children}</>;
    }

    console.log('Admin layout: Got user from getUser', { 
      userId: user.id, 
      email: user.email 
    });

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id, supabase);
    console.log('Admin layout: isAdmin check result', { 
      userId: user.id, 
      isAdmin: userIsAdmin 
    });

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
              Admin access required. You are logged in as {user.email}, but your account does not have admin privileges.
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
    // On error, log it but show error page instead of redirecting to prevent loops
    console.error('Admin layout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Only redirect to login if it's clearly an auth/session error
    // Otherwise show error page to prevent redirect loops
    if (errorMessage.includes('session') || errorMessage.includes('auth') || errorMessage.includes('cookie') || errorMessage.includes('Unauthorized')) {
      redirect('/login?next=' + encodeURIComponent('/admin'));
    }
    
    // For other errors, show error page instead of redirecting (prevents loops)
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
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Admin Access Error</h1>
          <p style={{ marginBottom: '24px', fontSize: '18px' }}>
            An error occurred while checking admin access: {errorMessage}
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }
}

