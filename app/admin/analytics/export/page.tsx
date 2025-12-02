'use client';

import { useState, useEffect } from 'react';

/**
 * Admin-scoped CSV & API Export Page
 * 
 * This is an admin-only wrapper around the export functionality.
 * While it's a client component, it checks admin status via API calls.
 * 
 * Key differences from /analytics/export:
 * - Shows admin-specific messaging about system-wide exports
 * - Renders under /admin layout
 * - Does NOT trigger the "Already signed in, redirecting..." logic from login page
 * 
 * Note: The server-side admin check happens via the admin layout/parent route.
 * This component assumes it's only accessible to admins.
 * 
 * Access: /admin/analytics/export
 */
export default function AdminExportPage() {
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('30');
  const [exporting, setExporting] = useState<string | null>(null);
  const [role, setRole] = useState<'investor' | 'wholesaler' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch user role and check admin status
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats && data.stats.role) {
          setRole(data.stats.role);
        }
        // Check if admin (admins can export all data)
        if (data.stats && (data.stats.role === 'admin' || data.stats.segment === 'admin')) {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        // Default to investor if fetch fails
        setRole('investor');
      });
  }, []);

  const handleExport = async (type: 'deals' | 'analytics') => {
    setExporting(type);
    try {
      // For admin, we could add an admin export endpoint, but for now use the regular one
      const response = await fetch(`/api/analytics/export?type=${type}&range=${dateRange}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `off-axis-deals-${type}-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <a href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </a>
      </div>
      
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
          CSV & API Export (Admin View)
        </h2>
        
        {isAdmin && (
          <div style={{ marginBottom: 24, padding: 16, background: '#e0f2fe', borderRadius: 8, border: '1px solid #0ea5e9' }}>
            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
              <strong>Admin Access:</strong> You can export system-wide analytics and data for reporting and analysis.
            </p>
          </div>
        )}

        {/* Date Range Selector */}
        <div style={{ marginBottom: 32 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: 8,
            }}
          >
            Date Range
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['30', '90', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `2px solid ${dateRange === range ? '#3b82f6' : '#e2e8f0'}`,
                  background: dateRange === range ? '#eff6ff' : '#fff',
                  color: dateRange === range ? '#1e40af' : '#475569',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {range === 'all' ? 'All Time' : `Last ${range} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <ExportButton
            title="Export All Listings & Leads (CSV)"
            description="Download all listings, leads, and performance metrics across the platform"
            onClick={() => handleExport('deals')}
            loading={exporting === 'deals'}
            disabled={!!exporting}
          />

          <ExportButton
            title="Export Analytics Summary (CSV)"
            description="Download aggregated analytics including conversion rates, response times, and market breakdowns"
            onClick={() => handleExport('analytics')}
            loading={exporting === 'analytics'}
            disabled={!!exporting}
          />
        </div>

        {/* API Access Section */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
            API Access
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            API access for Pro accounts and admins is coming soon. You&apos;ll be able to connect Off Axis Deals to your
            CRM and reporting tools for real-time data synchronization.
          </p>
          <div style={{ marginTop: 16, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              Planned Features:
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <li>RESTful API with OAuth2 authentication</li>
              <li>Webhook support for real-time updates</li>
              <li>GraphQL endpoint for flexible queries</li>
              <li>Rate limiting and usage analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportButton({
  title,
  description,
  onClick,
  loading,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: 20,
        background: '#fff',
        borderRadius: 12,
        border: '2px solid #e2e8f0',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.background = '#eff6ff';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.background = '#fff';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{description}</div>
        </div>
        {loading ? (
          <div style={{ fontSize: 14, color: '#3b82f6' }}>Exporting...</div>
        ) : (
          <div style={{ fontSize: 20 }}>📥</div>
        )}
      </div>
    </button>
  );
}

