'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import InvestorAnalyzer from '@/components/InvestorAnalyzer';
import WholesalerAnalyzer from '@/components/WholesalerAnalyzer';

export default function AnalyzerPage() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<'investor' | 'wholesaler' | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?next=/tools/analyzer');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'investor' || profile?.role === 'wholesaler') {
          setUserRole(profile.role);
        } else {
          // Default to investor if role not set
          setUserRole('investor');
        }
      } catch (error) {
        console.error('Error loading user role:', error);
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

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {userRole === 'investor' ? (
        <InvestorAnalyzer />
      ) : (
        <WholesalerAnalyzer />
      )}
    </div>
  );
}
