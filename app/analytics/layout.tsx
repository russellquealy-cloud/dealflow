import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isInvestorPro } from '@/lib/analytics/proGate';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/analytics');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, segment, tier, membership_tier')
    .eq('id', user.id)
    .single();

  // Check if user is Investor Pro
  if (!isInvestorPro(profile)) {
    redirect('/pricing?highlight=pro');
  }

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
            Track your investment performance and optimize your deal flow
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

