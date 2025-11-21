import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUserServer, createSupabaseServerComponent } from '@/app/lib/auth/server';
import { isPro } from '@/lib/analytics/proGate';

export const dynamic = 'force-dynamic';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error: authError } = await getAuthUserServer();

  if (authError || !user) {
    redirect('/login?next=/analytics/lead-conversion');
  }

  // Fetch user profile
  const supabase = createSupabaseServerComponent();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment, tier, membership_tier')
    .eq('id', user.id)
    .single();

  // Check if user is admin using the same logic as requireAdminServer
  const isAdminUser =
    profile?.role === 'admin' ||
    profile?.segment === 'admin' ||
    profile?.tier === 'enterprise' ||
    profile?.membership_tier === 'enterprise' ||
    user.email === 'admin@offaxisdeals.com';

  // Check if user is Pro (Investor or Wholesaler) - admins bypass this check
  if (!isAdminUser && !isPro(profile)) {
    redirect('/pricing?highlight=pro');
  }

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
