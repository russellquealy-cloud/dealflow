'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { logger } from '@/lib/logger';
import InvestorAnalyzer from '@/components/InvestorAnalyzer';
import WholesalerAnalyzer from '@/components/WholesalerAnalyzer';

type AnalyzerRole = 'investor' | 'wholesaler' | 'admin' | null;

export default function AnalyzerPage() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<AnalyzerRole>(null);
  const [adminView, setAdminView] = React.useState<'investor' | 'wholesaler'>('investor');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?next=/tools/analyzer');
          return;
        }

        // Check both 'role' and 'segment' fields to support both naming conventions
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, segment')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          logger.error('Error fetching profile:', profileError);
          setUserRole('investor'); // Default on error
          return;
        }

        // Prefer 'segment' over 'role' for consistency with Header component
        const role = profile?.segment || profile?.role;
        
        if (role === 'admin') {
          setUserRole('admin');
          setAdminView('investor');
        } else if (role === 'investor' || role === 'wholesaler') {
          setUserRole(role);
        } else {
          // Default to investor if role not set
          setUserRole('investor');
        }
      } catch (error) {
        logger.error('Error loading user role:', error);
        setUserRole('investor'); // Default
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: 18,
        color: '#6b7280',
      }}>
        Loading analyzer...
      </div>
    );
  }

  if (!userRole) {
    return null; // Will redirect
  }

  const effectiveRole = userRole === 'admin' ? adminView : userRole;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {userRole === 'admin' && (
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '24px 20px 0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setAdminView('investor')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: adminView === 'investor' ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: adminView === 'investor' ? '#2563eb' : '#ffffff',
              color: adminView === 'investor' ? '#ffffff' : '#1f2937',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Investor View
          </button>
          <button
            type="button"
            onClick={() => setAdminView('wholesaler')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: adminView === 'wholesaler' ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: adminView === 'wholesaler' ? '#2563eb' : '#ffffff',
              color: adminView === 'wholesaler' ? '#ffffff' : '#1f2937',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Wholesaler View
          </button>
        </div>
      )}

      {effectiveRole === 'investor' ? <InvestorAnalyzer /> : <WholesalerAnalyzer />}
    </div>
  );
}
