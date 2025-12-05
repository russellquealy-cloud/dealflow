import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getAuthUserServer } from '@/lib/auth/server';
import type { AnyProfile } from "@/lib/profileCompleteness";

export const dynamic = 'force-dynamic';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use getAuthUserServer to check auth without auto-redirect
  // This prevents redirect loops - we only redirect if user is actually not authenticated
  const { user, supabase, error: authError } = await getAuthUserServer();
  
  // Only redirect to login if user is truly not authenticated
  // CRITICAL: Do NOT redirect if user exists - this prevents loops
  // The login page will handle redirecting authenticated users back to analytics
  if (!user || authError) {
    console.log('[analytics/layout] No authenticated user, redirecting to login', {
      hasUser: !!user,
      error: authError?.message,
    });
    
    // Get the actual pathname from middleware-injected header
    // This ensures we redirect to login with the correct path (e.g., /analytics/heatmap, not /analytics/lead-conversion)
    const headersList = await headers();
    const currentPathname = headersList.get('x-pathname') || '/analytics/lead-conversion';
    
    // Use the actual pathname from the request for accurate redirect
    // This prevents redirect loops by preserving where the user was trying to go
    redirect(`/login?next=${encodeURIComponent(currentPathname)}`);
  }
  
  // User is authenticated - continue rendering

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment, tier, membership_tier')
    .eq('id', user.id)
    .maybeSingle<AnyProfile>();

  // Check if user is admin - admins always have access
  const isAdmin =
    profile?.role === 'admin' ||
    profile?.segment === 'admin' ||
    profile?.tier === 'enterprise' ||
    profile?.membership_tier === 'enterprise' ||
    profile?.email === 'admin@offaxisdeals.com';

  // All authenticated users can access analytics - no Pro gate
  // Analytics API route returns data for any authenticated user
  // Admins always have full access regardless of segment or tier

  const role = (profile?.role || profile?.segment || 'investor').toLowerCase() as 'investor' | 'wholesaler';
  const isWholesaler = role === 'wholesaler';

  const navLinks = [
    { href: '/analytics/lead-conversion', label: 'Lead Conversion Trends' },
    { href: '/analytics/heatmap', label: 'Geographic Heatmap' },
    { href: '/analytics/export', label: 'CSV & API Export' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800, color: '#0f172a' }}>
            Advanced Analytics
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            {isWholesaler 
              ? 'Track your listing performance and optimize your lead generation'
              : 'Track your investment performance and optimize your deal flow'}
          </p>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            flexWrap: 'wrap',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 16,
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#475569',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              className="hover:bg-blue-50 hover:text-blue-600"
              prefetch={true}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
