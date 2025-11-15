'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session - redirect to login (but don't set next=/admin to prevent loops)
          window.location.href = '/login';
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, segment')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Check both role and segment fields (some accounts may have admin in segment)
        const userIsAdmin = checkIsAdminClient(profile);
        setIsAdmin(userIsAdmin);
        
        // Log the result for debugging
        console.log('🔒 Admin page: Admin check result:', {
          userEmail: session.user.email,
          userId: session.user.id,
          profileRole: profile?.role,
          profileSegment: profile?.segment,
          isAdmin: userIsAdmin,
        });
        
        // Don't redirect - let the page show diagnostic info if not admin
        // The page will show "Access Denied" with diagnostic tools
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        // Don't redirect on error - show diagnostic info instead
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
        <p style={{ marginBottom: '24px' }}>Admin access required</p>
        
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#991b1b' }}>Diagnostic Information</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            If you believe you should have admin access, you can:
          </p>
          <ol style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Check your account status:</strong> Visit{' '}
              <a href="/api/admin/diagnose" target="_blank" style={{ color: '#2563eb' }}>
                /api/admin/diagnose
              </a>{' '}
              to see your current role and segment settings.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Fix admin account:</strong> If you&apos;re logged in as admin@offaxisdeals.com, you can{' '}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/fix-account', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: 'admin@offaxisdeals.com' }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      alert('✅ Admin account fixed! Please refresh the page.');
                      window.location.reload();
                    } else {
                      alert(`Error: ${data.error || 'Failed to fix account'}`);
                    }
                  } catch (error) {
                    alert(`Error: ${error instanceof Error ? error.message : 'Failed to fix account'}`);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Click here to fix your admin account
              </button>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Run SQL script:</strong> Execute the SQL script at{' '}
              <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                supabase/sql/fix_admin_account.sql
              </code>{' '}
              in your Supabase SQL editor.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  const features = [
    {
      name: 'Alerts & Watchlists',
      description: 'Property alerts and watchlist management',
      links: [
        { name: 'Alerts', href: '/admin/alerts', status: 'stub' },
        { name: 'Watchlists', href: '/admin/watchlists', status: 'stub' }
      ]
    },
    {
      name: 'AI Tools',
      description: 'AI Analyzer and Repair Estimator',
      links: [
        { name: 'AI Analyzer', href: '/tools/analyzer', status: 'exists' },
        { name: 'Repair Estimator', href: '/admin/repair-estimator', status: 'stub' }
      ]
    },
    {
      name: 'Reports & Export',
      description: 'Exportable reports and CRM integration',
      links: [
        { name: 'Export Reports', href: '/admin/reports', status: 'stub' },
        { name: 'CRM Export', href: '/admin/crm-export', status: 'stub' }
      ]
    },
    {
      name: 'Analytics',
      description: 'Advanced analytics and market data',
      links: [
        { name: 'Analytics Dashboard', href: '/admin/analytics', status: 'stub' },
        { name: 'Off-Market Feed', href: '/admin/off-market', status: 'stub' }
      ]
    },
    {
      name: 'Team & Organization',
      description: 'Team management and white-label branding',
      links: [
        { name: 'Team Seats', href: '/admin/team', status: 'stub' },
        { name: 'White-label Branding', href: '/admin/branding', status: 'stub' }
      ]
    },
    {
      name: 'Support & Communication',
      description: 'Support system and user communication',
      links: [
        { name: 'Support Center', href: '/admin/support', status: 'stub' },
        { name: 'Feedback System', href: '/admin/feedback', status: 'stub' },
        { name: 'Contact Sales', href: '/admin/contact-sales', status: 'exists' }
      ]
    },
    {
      name: 'Integrations',
      description: 'Custom integrations and API access',
      links: [
        { name: 'Custom Integrations', href: '/admin/integrations', status: 'stub' },
        { name: 'API Documentation', href: '/admin/api-docs', status: 'stub' }
      ]
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#1a1a1a' }}>Admin Dashboard - Feature Testing</h1>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#495057' }}>Feature Status Legend</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '50%' }}></div>
            <span>Exists & Functional</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '50%' }}></div>
            <span>Stub/Placeholder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '50%' }}></div>
            <span>Missing</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>{feature.name}</h3>
            <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
              {feature.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feature.links.map((link, linkIndex) => (
                <Link
                  key={linkIndex}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: link.status === 'exists' ? '#d4edda' : '#fff3cd',
                    border: `1px solid ${link.status === 'exists' ? '#c3e6cb' : '#ffeaa7'}`,
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#1a1a1a',
                    fontSize: '14px'
                  }}
                >
                  <span>{link.name}</span>
                  <span style={{
                    fontSize: '12px',
                    color: link.status === 'exists' ? '#155724' : '#856404',
                    fontWeight: '500'
                  }}>
                    {link.status === 'exists' ? '✓ Ready' : '⚠ Stub'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #bbdefb'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Link 
            href="/pricing" 
            style={{
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Test Pricing Page
          </Link>
          <Link 
            href="/listings" 
            style={{
              padding: '10px 20px',
              background: '#388e3c',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Test Listings Page
          </Link>
          <Link 
            href="/my-listings" 
            style={{
              padding: '10px 20px',
              background: '#f57c00',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Test My Listings
          </Link>
        </div>
      </div>
    </div>
  );
}