import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { requireAdminServer } from "@/lib/admin";

// Mark admin routes as dynamic since they use cookies for authentication
// This suppresses the build-time warnings about static generation
export const dynamic = 'force-dynamic';

/**
 * Server-side layout protection for /admin routes
 * This ensures only admin users can access admin pages
 * 
 * Behavior:
 * - If user is not signed in -> redirect to /login?next=/admin
 * - If user is signed in but not admin -> redirect to /dashboard (safe default, no loop)
 * - If user is admin -> allow access
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Use requireAdminServer for consistent admin checking
    const adminCheck = await requireAdminServer();
    
    if (!adminCheck.ok) {
      // User is not authenticated or not admin
      if (adminCheck.reason === 'unauthenticated') {
        // Not signed in -> redirect to login
        redirect('/login?next=' + encodeURIComponent('/admin'));
      } else {
        // Signed in but not admin -> redirect to dashboard (safe default, no loop)
        redirect('/dashboard');
      }
    }

    // User is admin - allow access
    return <>{children}</>;
  } catch (error) {
    // Next.js redirect() throws a special error that we should not catch
    // Check if this is a redirect error and re-throw it
    // Next.js redirect errors can be identified by:
    // 1. Having a digest property starting with 'NEXT_REDIRECT'
    // 2. Having a message containing 'NEXT_REDIRECT'
    // 3. Being a RedirectError type
    const isRedirectError = 
      (error && typeof error === 'object' && 'digest' in error && 
       String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) ||
      (error instanceof Error && error.message === 'NEXT_REDIRECT') ||
      (error && typeof error === 'object' && 'message' in error && 
       String((error as { message?: unknown }).message) === 'NEXT_REDIRECT');
    
    if (isRedirectError) {
      // Re-throw the redirect error so Next.js can handle it
      throw error;
    }
    
    // For actual errors (not redirects), log and show error page
    console.error('Admin layout error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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

