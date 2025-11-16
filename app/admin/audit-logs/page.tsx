'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin';
import Link from 'next/link';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { id: string; email: string | null; full_name: string | null };
}

export default function AdminAuditLogsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, segment')
          .eq('id', session.user.id)
          .single();

        const userIsAdmin = checkIsAdminClient(profile);
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const loadLogs = async () => {
      setDataLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers: HeadersInit = {};
        if (session.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        let query = supabase
          .from('audit_logs')
          .select(`
            *,
            user:profiles!audit_logs_user_id_fkey(id, email, full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(500);

        if (actionFilter !== 'all') {
          query = query.ilike('action', `%${actionFilter}%`);
        }

        if (resourceTypeFilter !== 'all') {
          query = query.eq('resource_type', resourceTypeFilter);
        }

        const { data: logsData, error } = await query;

        if (error) {
          console.error('Error loading audit logs:', error);
        } else {
          setLogs(logsData || []);
        }
      } catch (error) {
        console.error('Error loading audit logs:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadLogs();
  }, [isAdmin, actionFilter, resourceTypeFilter]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Access Denied</h1>
        <p>Admin access required</p>
        <Link href="/admin" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link 
          href="/admin" 
          style={{ 
            display: 'inline-block',
            marginBottom: '16px',
            color: '#2563eb', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>System Audit Logs</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          View system activity and user actions
        </p>
      </div>

      {/* Filters */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        background: '#fff',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter === 'all' ? '' : actionFilter}
          onChange={(e) => setActionFilter(e.target.value || 'all')}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            flex: 1,
            minWidth: '200px'
          }}
        />
        <select
          value={resourceTypeFilter}
          onChange={(e) => setResourceTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Resource Types</option>
          <option value="user">Users</option>
          <option value="listing">Listings</option>
          <option value="message">Messages</option>
          <option value="flag">Flags</option>
        </select>
      </div>

      {/* Logs Table */}
      {dataLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading audit logs...
        </div>
      ) : (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#fff'
        }}>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Resource</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {log.user?.email || log.user?.full_name || log.user_id || 'System'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {log.resource_type && log.resource_id ? (
                          <span style={{ color: '#6b7280' }}>
                            {log.resource_type}: {log.resource_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', maxWidth: '300px' }}>
                        {log.details ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ color: '#2563eb', fontSize: '12px' }}>View Details</summary>
                            <pre style={{
                              marginTop: '8px',
                              padding: '8px',
                              background: '#f9fafb',
                              borderRadius: '4px',
                              fontSize: '11px',
                              overflow: 'auto',
                              maxHeight: '200px'
                            }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {log.ip_address || <span style={{ color: '#9ca3af' }}>—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

