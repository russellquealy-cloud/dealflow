'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { checkIsAdminClient } from '@/lib/admin';
import Link from 'next/link';

interface UserUsage {
  userId: string;
  email: string | null;
  tier: string | null;
  segment: string | null;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsOn: string;
}

interface TierUsage {
  tier: string;
  totalUsers: number;
  usersWithUsage: number;
  totalUsed: number;
  averageUsage: number;
  monthStart: string;
}

interface ErrorLog {
  id: string;
  userId: string;
  userEmail: string | null;
  createdAt: string;
  analysisType: string;
  costCents: number;
}

export default function AdminAIUsagePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'tiers' | 'errors'>('users');
  
  const [userUsage, setUserUsage] = useState<UserUsage[]>([]);
  const [tierUsage, setTierUsage] = useState<TierUsage[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');

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

    const loadData = async () => {
      setDataLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers: HeadersInit = {};
        if (session.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        if (activeTab === 'users') {
          // Load all users with usage
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, tier, segment')
            .order('email', { ascending: true })
            .limit(100);

          if (profiles) {
            const usagePromises = profiles.map(async (profile) => {
              const response = await fetch(`/api/ai-usage?userId=${profile.id}`, {
                headers,
                credentials: 'include',
                cache: 'no-store',
              });

              if (!response.ok) {
                return null;
              }

              const data = await response.json();
              return {
                userId: profile.id,
                email: profile.email,
                tier: data.tier || profile.tier,
                segment: data.segment || profile.segment,
                used: data.used,
                limit: data.limit,
                remaining: data.remaining,
                resetsOn: data.resetsOn,
              } as UserUsage;
            });

            const results = await Promise.all(usagePromises);
            setUserUsage(results.filter((r): r is UserUsage => r !== null));
          }
        } else if (activeTab === 'tiers') {
          // Load usage by tier
          const tiers = ['free', 'basic', 'pro', 'enterprise'];
          const tierPromises = tiers.map(async (tier) => {
            const response = await fetch(`/api/ai-usage?tier=${tier}`, {
              headers,
              credentials: 'include',
              cache: 'no-store',
            });

            if (!response.ok) {
              return null;
            }

            const data = await response.json();
            return data as TierUsage;
          });

          const results = await Promise.all(tierPromises);
          setTierUsage(results.filter((r): r is TierUsage => r !== null));
        } else if (activeTab === 'errors') {
          // Load error logs
          const response = await fetch('/api/ai-usage?errors=true', {
            headers,
            credentials: 'include',
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();
            setErrors(data.errors || []);
          }
        }
      } catch (error) {
        console.error('Error loading AI usage data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isAdmin, activeTab]);

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

  const filteredUserUsage = searchEmail
    ? userUsage.filter((u) => u.email?.toLowerCase().includes(searchEmail.toLowerCase()))
    : userUsage;

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
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>AI Usage Reporting</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          Monitor AI usage across users, tiers, and track errors
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'users' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'users' ? 600 : 400,
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px',
            fontSize: '14px'
          }}
        >
          Usage by User
        </button>
        <button
          onClick={() => setActiveTab('tiers')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'tiers' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'tiers' ? 600 : 400,
            cursor: 'pointer',
            borderBottom: activeTab === 'tiers' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px',
            fontSize: '14px'
          }}
        >
          Usage by Tier
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'errors' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'errors' ? 600 : 400,
            cursor: 'pointer',
            borderBottom: activeTab === 'errors' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px',
            fontSize: '14px'
          }}
        >
          Errors
        </button>
      </div>

      {/* Content */}
      {dataLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading data...
        </div>
      ) : activeTab === 'users' ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '300px',
                maxWidth: '100%'
              }}
            />
          </div>
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
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Tier</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Segment</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>Used</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>Limit</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>Remaining</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Resets On</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserUsage.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUserUsage.map((user) => (
                    <tr key={user.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{user.email || 'N/A'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: user.tier === 'pro' ? '#dbeafe' : user.tier === 'basic' ? '#f3e8ff' : '#f3f4f6',
                          color: user.tier === 'pro' ? '#1e40af' : user.tier === 'basic' ? '#7c3aed' : '#6b7280',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {user.tier?.toUpperCase() || 'FREE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', textTransform: 'capitalize' }}>
                        {user.segment || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>
                        {user.used}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                        {user.limit === null ? '∞' : user.limit}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: user.remaining !== null && user.remaining < (user.limit || 0) * 0.2 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                        {user.remaining === null ? '∞' : user.remaining}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(user.resetsOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'tiers' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {tierUsage.map((tier) => (
            <div key={tier.tier} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              background: '#fff'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, textTransform: 'capitalize' }}>
                {tier.tier} Tier
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Users:</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{tier.totalUsers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Users with Usage:</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{tier.usersWithUsage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Used:</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{tier.totalUsed}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Average Usage:</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{tier.averageUsage}</span>
                </div>
              </div>
            </div>
          ))}
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
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>User Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>Cost (cents)</th>
              </tr>
            </thead>
            <tbody>
              {errors.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No errors found
                  </td>
                </tr>
              ) : (
                errors.map((error) => (
                  <tr key={error.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(error.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{error.userEmail || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', textTransform: 'capitalize' }}>
                      {error.analysisType}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                      {error.costCents}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

