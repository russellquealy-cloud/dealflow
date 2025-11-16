'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin';
import Link from 'next/link';

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  segment: string | null;
  tier: string | null;
  suspended: boolean;
  banned: boolean;
  verified_by_admin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSuspended, setFilterSuspended] = useState<string>('all');
  const [filterBanned, setFilterBanned] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState<{ userId: string; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState<number | null>(null);
  const [actionNotes, setActionNotes] = useState('');

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

    const loadUsers = async () => {
      setDataLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers: HeadersInit = {};
        if (session.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterSuspended === 'true') params.set('suspended', 'true');
        if (filterBanned === 'true') params.set('banned', 'true');
        if (filterVerified === 'true') params.set('verified', 'true');

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          headers,
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin, search, filterSuspended, filterBanned, filterVerified]);

  const handleAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId,
          action,
          reason: actionReason || undefined,
          durationDays: actionDuration || undefined,
          notes: actionNotes || undefined,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(u => u.id === userId ? { ...u, ...data.user } : u));
        setShowActionModal(null);
        setActionReason('');
        setActionDuration(null);
        setActionNotes('');
        alert(data.message || 'Action completed successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setActionLoading(null);
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
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>User Moderation</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          Manage user accounts: suspend, ban, verify, and view user details
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
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          value={filterSuspended}
          onChange={(e) => setFilterSuspended(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Suspension Status</option>
          <option value="true">Suspended Only</option>
        </select>
        <select
          value={filterBanned}
          onChange={(e) => setFilterBanned(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Ban Status</option>
          <option value="true">Banned Only</option>
        </select>
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Verification Status</option>
          <option value="true">Verified Only</option>
        </select>
      </div>

      {/* Users Table */}
      {dataLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading users...
        </div>
      ) : (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#fff'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Tier</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{user.email || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {user.full_name || user.company_name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', textTransform: 'capitalize' }}>
                      {user.tier || 'free'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {user.banned && (
                          <span style={{
                            padding: '4px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            Banned
                          </span>
                        )}
                        {user.suspended && !user.banned && (
                          <span style={{
                            padding: '4px 8px',
                            background: '#fef3c7',
                            color: '#d97706',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            Suspended
                          </span>
                        )}
                        {user.verified_by_admin && (
                          <span style={{
                            padding: '4px 8px',
                            background: '#d1fae5',
                            color: '#059669',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {!user.banned && (
                          <button
                            onClick={() => setShowActionModal({ userId: user.id, action: user.suspended ? 'unsuspend' : 'suspend' })}
                            disabled={actionLoading === user.id}
                            style={{
                              padding: '6px 12px',
                              minHeight: '32px',
                              background: user.suspended ? '#f3f4f6' : '#fef3c7',
                              color: user.suspended ? '#6b7280' : '#d97706',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                              touchAction: 'manipulation'
                            }}
                          >
                            {user.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                        <button
                          onClick={() => setShowActionModal({ userId: user.id, action: user.banned ? 'unban' : 'ban' })}
                          disabled={actionLoading === user.id}
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            background: user.banned ? '#f3f4f6' : '#fee2e2',
                            color: user.banned ? '#6b7280' : '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                            touchAction: 'manipulation'
                          }}
                        >
                          {user.banned ? 'Unban' : 'Ban'}
                        </button>
                        <button
                          onClick={() => handleAction(user.id, user.verified_by_admin ? 'unverify' : 'verify')}
                          disabled={actionLoading === user.id}
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            background: user.verified_by_admin ? '#f3f4f6' : '#d1fae5',
                            color: user.verified_by_admin ? '#6b7280' : '#059669',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                            touchAction: 'manipulation'
                          }}
                        >
                          {user.verified_by_admin ? 'Unverify' : 'Verify'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
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
          setShowActionModal(null);
          setActionReason('');
          setActionDuration(null);
          setActionNotes('');
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
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
              {showActionModal.action === 'suspend' ? 'Suspend User' :
               showActionModal.action === 'ban' ? 'Ban User' :
               showActionModal.action === 'unsuspend' ? 'Unsuspend User' :
               'Unban User'}
            </h2>
            {(showActionModal.action === 'suspend' || showActionModal.action === 'ban') && (
              <>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Reason (required)
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={3}
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
                {showActionModal.action === 'suspend' && (
                  <>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                      Duration (days, optional - leave empty for permanent)
                    </label>
                    <input
                      type="number"
                      value={actionDuration || ''}
                      onChange={(e) => setActionDuration(e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="e.g., 7, 30"
                      min={1}
                      style={{
                        width: '100%',
                        padding: '12px',
                        minHeight: '44px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '16px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </>
                )}
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Notes (optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
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
              </>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setActionReason('');
                  setActionDuration(null);
                  setActionNotes('');
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
                onClick={() => {
                  if ((showActionModal.action === 'suspend' || showActionModal.action === 'ban') && !actionReason.trim()) {
                    alert('Please enter a reason');
                    return;
                  }
                  handleAction(showActionModal.userId, showActionModal.action);
                }}
                disabled={actionLoading === showActionModal.userId}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: showActionModal.action === 'ban' ? '#dc2626' : showActionModal.action === 'suspend' ? '#d97706' : '#059669',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: actionLoading === showActionModal.userId ? 'not-allowed' : 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                {actionLoading === showActionModal.userId ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

