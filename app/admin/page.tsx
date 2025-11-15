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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, segment')
          .eq('id', session.user.id)
          .single();
        
        // Check both role and segment fields (some accounts may have admin in segment)
        setIsAdmin(checkIsAdminClient(profile));
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>Admin access required</p>
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