'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin-client';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugAuth, setDebugAuth] = useState<{
    status?: number;
    ok?: boolean;
    sessionSummary?: { email?: string | null };
    profileSummary?: { role?: string | null; segment?: string | null };
    isAdmin?: boolean;
    error?: string;
  } | null>(null);

  console.log('Admin page: COMPONENT RENDERING - NO REDIRECTS');

  useEffect(() => {
    console.log('Admin page: useEffect running - checking admin status');
    const checkAdmin = async () => {
      try {
        // Wait a bit for cookies to sync if we just logged in
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session - wait a bit more and try again (cookies might still be syncing)
          console.log('Admin page: No session on first check, waiting for cookie sync...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) {
            console.log('Admin page: No session after retry, redirecting to login');
            setIsAdmin(false);
            setLoading(false);
            // Redirect to login if no session after retry
            window.location.href = '/login?next=' + encodeURIComponent('/admin');
            return;
          }
          
          // Use retry session
          session = retrySession;
        }

        if (!session) {
          console.log('Admin page: No session found, redirecting to login');
          setIsAdmin(false);
          setLoading(false);
          window.location.href = '/login?next=' + encodeURIComponent('/admin');
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
        console.log('Admin page: Admin check result:', {
          userEmail: session.user.email,
          userId: session.user.id,
          profileRole: profile?.role,
          profileSegment: profile?.segment,
          isAdmin: userIsAdmin,
        });
        
        // NO REDIRECTS - just set the state and let the page render

        // Fetch debug auth info if user is admin
        if (userIsAdmin) {
          try {
            const debugResponse = await fetch('/api/admin/debug-auth', {
              credentials: 'include',
            });
            const debugData = await debugResponse.json();
            setDebugAuth(debugData);
          } catch (debugError) {
            console.error('Error fetching debug auth:', debugError);
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        // NO REDIRECTS on error either
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
                      alert('Γ£à Admin account fixed! Please refresh the page.');
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
      name: 'User Analytics (Pro Features)',
      description: 'Advanced analytics for Pro users - Lead conversion, heatmaps, and data export',
      links: [
        { name: 'Lead Conversion Trends', href: '/admin/analytics/lead-conversion', status: 'exists' },
        { name: 'Geographic Heatmap', href: '/admin/analytics/heatmap', status: 'exists' },
        { name: 'CSV & API Export', href: '/admin/analytics/export', status: 'exists' }
      ]
    },
    {
      name: 'Alerts & Watchlists',
      description: 'Property alerts and watchlist management',
      links: [
        { name: 'Alerts', href: '/admin/alerts', status: 'stub' },
        { name: 'Watchlists Admin', href: '/admin/watchlists', status: 'exists' },
        { name: 'User Watchlists', href: '/watchlists', status: 'exists' }
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
        { name: 'Export Reports', href: '/admin/reports', status: 'exists' },
        { name: 'CRM Export', href: '/admin/crm-export', status: 'stub' }
      ]
    },
    {
      name: 'Admin Analytics',
      description: 'Admin-level analytics and system overview',
      links: [
        { name: 'Analytics Dashboard', href: '/admin/analytics', status: 'exists' },
        { name: 'AI Usage Reporting', href: '/admin/ai-usage', status: 'exists' },
        { name: 'Off-Market Feed', href: '/admin/off-market', status: 'stub' }
      ]
    },
    {
      name: 'User & Content Moderation',
      description: 'User management, flags, and content moderation tools',
      links: [
        { name: 'User Moderation', href: '/admin/users', status: 'exists' },
        { name: 'Flags & Reports', href: '/admin/flags', status: 'exists' },
        { name: 'Audit Logs', href: '/admin/audit-logs', status: 'exists' }
      ]
    },
    {
      name: 'System & Diagnostics',
      description: 'System health, diagnostics, and admin tools',
      links: [
        { name: 'Admin Diagnostics', href: '/api/admin/diagnose', status: 'exists' },
        { name: 'Fix Admin Account', href: '/api/admin/fix-account', status: 'exists' },
        { name: 'Email Test', href: '/api/email/test', status: 'exists' },
        { name: 'Health Check', href: '/api/health', status: 'exists' }
      ]
    },
    {
      name: 'Support & Communication',
      description: 'Support system and user communication',
      links: [
        { name: 'Support Center', href: '/admin/support', status: 'exists' },
        { name: 'Feedback System', href: '/admin/feedback', status: 'exists' },
        { name: 'Contact Sales', href: '/contact-sales', status: 'exists' }
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
      
      {/* TODO: When auth is confirmed stable in production, remove this debug panel */}
      {isAdmin && debugAuth && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          background: debugAuth.status === 200 ? '#d4edda' : '#f8d7da',
          border: `1px solid ${debugAuth.status === 200 ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: debugAuth.status === 200 ? '#155724' : '#721c24' }}>
            Admin Auth Debug (Temporary)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div>
              <strong>Status:</strong> <span style={{ color: debugAuth.status === 200 ? '#155724' : '#721c24' }}>{debugAuth.status}</span>
            </div>
            <div>
              <strong>OK:</strong> {debugAuth.ok ? '✅' : '❌'}
            </div>
            <div>
              <strong>Email:</strong> {debugAuth.sessionSummary?.email || 'N/A'}
            </div>
            <div>
              <strong>Role:</strong> {debugAuth.profileSummary?.role || 'N/A'}
            </div>
            <div>
              <strong>Segment:</strong> {debugAuth.profileSummary?.segment || 'N/A'}
            </div>
            <div>
              <strong>Is Admin:</strong> {debugAuth.isAdmin ? '✅' : '❌'}
            </div>
          </div>
          {debugAuth.error && (
            <div style={{ marginTop: '8px', color: '#721c24', fontSize: '11px' }}>
              <strong>Error:</strong> {debugAuth.error}
            </div>
          )}
          {debugAuth.status !== 200 && (
            <div style={{ marginTop: '8px', color: '#721c24', fontSize: '11px' }}>
              Admin debug-auth failed (status {debugAuth.status}). Check server logs for [admin/debug-auth].
            </div>
          )}
        </div>
      )}
      
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
            <span>Ready</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '50%' }}></div>
            <span>Stub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '50%' }}></div>
            <span>Needs Implementation</span>
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
                    background: link.status === 'exists' ? '#d4edda' : link.status === 'stub' ? '#fff3cd' : '#f8d7da',
                    border: `1px solid ${link.status === 'exists' ? '#c3e6cb' : link.status === 'stub' ? '#ffeaa7' : '#f5c6cb'}`,
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#1a1a1a',
                    fontSize: '14px'
                  }}
                >
                  <span>{link.name}</span>
                  <span style={{
                    fontSize: '12px',
                    color: link.status === 'exists' ? '#155724' : link.status === 'stub' ? '#856404' : '#dc3545',
                    fontWeight: '500'
                  }}>
                    {link.status === 'exists' ? 'Ready' : link.status === 'stub' ? 'Stub' : 'Needs Implementation'}
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
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.email) {
                  alert('Γ¥î No session found. Please log in first.');
                  return;
                }

                const response = await fetch('/api/email/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ email: session.user.email }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                  console.error('Email diagnostics failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                  });
                  
                  if (response.status === 401) {
                    alert('Unauthorized: Please ensure you are logged in as an admin user.');
                  } else if (response.status === 403) {
                    alert('Forbidden: Admin access required. Your account may not have admin privileges.');
                  } else {
                    alert(`Email diagnostics failed (${response.status}): ${errorData.message || 'Unknown error'}`);
                  }
                  return;
                }

                const data = await response.json();
                
                if (data.success) {
                  alert(`Email diagnostics completed!\n\nCheck your inbox (${session.user.email}) for test emails.\n\nMagic Link: ${data.results?.magicLink?.success ? 'Success' : 'Failed'}\nPassword Reset: ${data.results?.passwordReset?.success ? 'Success' : 'Failed'}`);
                } else {
                  const errors = [
                    data.results?.magicLink?.error ? `Magic Link: ${data.results.magicLink.error}` : null,
                    data.results?.passwordReset?.error ? `Password Reset: ${data.results.passwordReset.error}` : null,
                  ].filter(Boolean).join('\n');
                  alert(`Email diagnostics completed with errors:\n\n${errors || data.message || 'Unknown error'}\n\nCheck console for details.`);
                }
                
                console.log('Email diagnostics result:', data);
              } catch (error) {
                console.error('Error running email diagnostics:', error);
                alert(`Γ¥î Error: ${error instanceof Error ? error.message : 'Failed to run diagnostics'}`);
              }
            }}
            style={{
              padding: '10px 20px',
              background: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ≡ƒôº Send Test Email to Myself
          </button>
        </div>
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
            Pricing Page
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
            Listings Page
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
            My Listings
          </Link>
          <Link 
            href="/analytics/lead-conversion" 
            style={{
              padding: '10px 20px',
              background: '#7b1fa2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Analytics (Pro)
          </Link>
          <Link 
            href="/account" 
            style={{
              padding: '10px 20px',
              background: '#0288d1',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Account Settings
          </Link>
          <Link 
            href="/watchlists" 
            style={{
              padding: '10px 20px',
              background: '#5c6bc0',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Watchlists
          </Link>
        </div>
      </div>
    </div>
  );
}
