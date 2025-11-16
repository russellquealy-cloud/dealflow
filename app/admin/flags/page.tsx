'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin';
import Link from 'next/link';

interface Flag {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  reporter?: { id: string; email: string | null; full_name: string | null };
  resolver?: { id: string; email: string | null; full_name: string | null };
}

export default function AdminFlagsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

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

    const loadFlags = async () => {
      setDataLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers: HeadersInit = {};
        if (session.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (targetTypeFilter !== 'all') params.set('targetType', targetTypeFilter);

        const response = await fetch(`/api/admin/flags?${params.toString()}`, {
          headers,
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setFlags(data.flags || []);
        }
      } catch (error) {
        console.error('Error loading flags:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadFlags();
  }, [isAdmin, statusFilter, targetTypeFilter]);

  const handleStatusUpdate = async (flagId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/flags', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          flagId,
          status: newStatus,
          resolutionNotes: resolutionNotes || undefined,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFlags(flags.map(f => f.id === flagId ? data.flag : f));
        setSelectedFlag(null);
        setResolutionNotes('');
        alert('Flag status updated successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update flag');
      }
    } catch (error) {
      console.error('Error updating flag:', error);
      alert('Failed to update flag');
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', color: '#d97706' };
      case 'reviewing': return { bg: '#dbeafe', color: '#2563eb' };
      case 'resolved': return { bg: '#d1fae5', color: '#059669' };
      case 'dismissed': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

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
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>Flags & Reports</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          Review and manage user-reported content and behavior
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Types</option>
          <option value="listing">Listings</option>
          <option value="user">Users</option>
          <option value="message">Messages</option>
          <option value="profile">Profiles</option>
        </select>
      </div>

      {/* Flags List */}
      {dataLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading flags...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {flags.length === 0 ? (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              background: '#fff',
              color: '#6b7280'
            }}>
              No flags found
            </div>
          ) : (
            flags.map((flag) => {
              const statusStyle = getStatusColor(flag.status);
              return (
                <div
                  key={flag.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {flag.status}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}>
                          {flag.target_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                        Reason: {flag.reason}
                      </div>
                      {flag.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                          {flag.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Reported by: {flag.reporter?.email || flag.reporter?.full_name || 'Unknown'} • {new Date(flag.created_at).toLocaleString()}
                      </div>
                      {flag.resolved_at && (
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Resolved by: {flag.resolver?.email || flag.resolver?.full_name || 'Unknown'} • {new Date(flag.resolved_at).toLocaleString()}
                        </div>
                      )}
                      {flag.resolution_notes && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                          Notes: {flag.resolution_notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {flag.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(flag.id, 'reviewing')}
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            touchAction: 'manipulation'
                          }}
                        >
                          Mark Reviewing
                        </button>
                      )}
                      {(flag.status === 'pending' || flag.status === 'reviewing') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFlag(flag);
                              setResolutionNotes('');
                            }}
                            style={{
                              padding: '6px 12px',
                              minHeight: '32px',
                              background: '#d1fae5',
                              color: '#059669',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              touchAction: 'manipulation'
                            }}
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(flag.id, 'dismissed')}
                            style={{
                              padding: '6px 12px',
                              minHeight: '32px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              touchAction: 'manipulation'
                            }}
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedFlag && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => {
          setSelectedFlag(null);
          setResolutionNotes('');
        }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Resolve Flag</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
              Flag: {selectedFlag.reason}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Resolution Notes (optional)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about how this was resolved..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                minHeight: '44px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedFlag(null);
                  setResolutionNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedFlag.id, 'resolved')}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: '#059669',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

