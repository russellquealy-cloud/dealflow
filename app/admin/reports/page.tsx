'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function AdminReports() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<Array<{ id: string; name: string; type: string; format: string; createdAt: string; size: string }>>([]);

  const handleGenerateReport = async (reportType: string, reportName: string) => {
    setGenerating(reportType);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to generate reports');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: reportType, format: 'csv' }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to generate report: ${errorData.error || 'Unknown error'}`);
        return;
      }

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Add to recent reports
      const newReport = {
        id: Date.now().toString(),
        name: reportName,
        type: reportType,
        format: 'CSV',
        createdAt: new Date().toISOString(),
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      };
      setRecentReports((prev) => [newReport, ...prev.slice(0, 9)]); // Keep last 10

      alert(`${reportName} generated and downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate report'}`);
    } finally {
      setGenerating(null);
    }
  };

  const reportTypes = [
    {
      id: 'listings',
      name: 'Property Listings Report',
      description: 'Export all property listings with details, owner info, and message counts',
      format: 'CSV',
      features: ['Property details', 'Pricing info', 'Owner contact data', 'Message counts', 'Featured status']
    },
    {
      id: 'users',
      name: 'User Activity Report',
      description: 'User engagement and activity analytics',
      format: 'CSV',
      features: ['User profiles', 'Listings created', 'Messages sent', 'Watchlist items', 'Account dates']
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Revenue and subscription analytics by tier',
      format: 'CSV',
      features: ['Users by tier', 'Estimated monthly revenue', 'Estimated yearly revenue', 'Subscription breakdown']
    },
    {
      id: 'market',
      name: 'Market Analysis Report',
      description: 'Market trends and property performance by location',
      format: 'CSV',
      features: ['Listings by city/state', 'Average prices', 'Property statistics', 'Market insights']
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px' }}>Reports & Export (Admin)</h1>


      <div style={{ display: 'grid', gap: '20px' }}>
        {reportTypes.map((report, index) => (
          <div key={index} style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{report.name}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>{report.description}</p>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6c757d' }}>
                  <span>Format: {report.format}</span>
                </div>
              </div>
              <button
                onClick={() => handleGenerateReport(report.id, report.name)}
                disabled={generating === report.id}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: generating === report.id ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: generating === report.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  touchAction: 'manipulation'
                }}
              >
                {generating === report.id ? 'Generating...' : `Generate ${report.format} Report`}
              </button>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>Features:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {report.features.map((feature, featureIndex) => (
                  <span
                    key={featureIndex}
                    style={{
                      padding: '4px 8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#495057'
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentReports.length > 0 && (
        <div style={{
          marginTop: '30px',
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Recent Reports</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentReports.map((report) => (
              <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{report.name}</span>
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6c757d' }}>
                    {report.format} • {report.size} • {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Re-generate the report
                    handleGenerateReport(report.type, report.name);
                  }}
                  style={{
                    padding: '5px 10px',
                    minHeight: '32px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    touchAction: 'manipulation'
                  }}
                >
                  Regenerate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
