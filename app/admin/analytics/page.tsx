'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

interface AnalyticsData {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  totalMessages: number;
  totalWatchlists: number;
  usersByRole: { investor: number; wholesaler: number; admin: number };
  usersByTier: { free: number; basic: number; pro: number; enterprise: number };
  listingsByStatus: Record<string, number>;
  recentActivity: Array<{ type: string; count: number; date: string }>;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalListings: 0,
    activeListings: 0,
    totalUsers: 0,
    totalMessages: 0,
    totalWatchlists: 0,
    usersByRole: { investor: 0, wholesaler: 0, admin: 0 },
    usersByTier: { free: 0, basic: 0, pro: 0, enterprise: 0 },
    listingsByStatus: {},
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      const now = new Date();
      let startDate: Date | null = null;
      if (dateRange !== 'all') {
        const days = parseInt(dateRange, 10);
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // Load all data in parallel
      const [
        listingsResult,
        usersResult,
        messagesResult,
        watchlistsResult,
        profilesResult,
      ] = await Promise.all([
        supabase.from('listings').select('id, status, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id, role, segment, tier, created_at', { count: 'exact' }),
        supabase.from('messages').select('id, created_at', { count: 'exact' }),
        supabase.from('watchlists').select('id, created_at', { count: 'exact' }),
        supabase.from('profiles').select('role, segment, tier'),
      ]);

      // Filter by date if needed
      const filteredListings = startDate
        ? (listingsResult.data || []).filter((l: { created_at?: string | null }) => new Date(l.created_at || '').getTime() >= startDate!.getTime())
        : listingsResult.data || [];
      const filteredUsers = startDate
        ? (usersResult.data || []).filter((u: { created_at?: string | null }) => new Date(u.created_at || '').getTime() >= startDate!.getTime())
        : usersResult.data || [];
      const filteredMessages = startDate
        ? (messagesResult.data || []).filter((m: { created_at: string }) => new Date(m.created_at).getTime() >= startDate!.getTime())
        : messagesResult.data || [];
      const filteredWatchlists = startDate
        ? (watchlistsResult.data || []).filter((w: { created_at: string }) => new Date(w.created_at).getTime() >= startDate!.getTime())
        : watchlistsResult.data || [];

      // Calculate status breakdown
      const listingsByStatus: Record<string, number> = {};
      (listingsResult.data || []).forEach((l: { status?: string | null }) => {
        const status = l.status || 'active';
        listingsByStatus[status] = (listingsByStatus[status] || 0) + 1;
      });

      // Calculate users by role
      const usersByRole = { investor: 0, wholesaler: 0, admin: 0 };
      (profilesResult.data || []).forEach((p: { role?: string | null; segment?: string | null }) => {
        const role = (p.role || p.segment || '').toLowerCase();
        if (role === 'admin') usersByRole.admin++;
        else if (role === 'investor') usersByRole.investor++;
        else if (role === 'wholesaler') usersByRole.wholesaler++;
      });

      // Calculate users by tier
      const usersByTier = { free: 0, basic: 0, pro: 0, enterprise: 0 };
      (profilesResult.data || []).forEach((p: { tier?: string | null }) => {
        const tier = (p.tier || 'free').toLowerCase();
        if (tier in usersByTier) {
          usersByTier[tier as keyof typeof usersByTier]++;
        }
      });

      // Calculate recent activity (last 7 days by day)
      const recentActivity: Array<{ type: string; count: number; date: string }> = [];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      last7Days.forEach((date) => {
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayListings = (listingsResult.data || []).filter((l: { created_at?: string | null }) => {
          const created = new Date(l.created_at || '');
          return created >= dayStart && created < dayEnd;
        }).length;

        const dayUsers = (usersResult.data || []).filter((u: { created_at?: string | null }) => {
          const created = new Date(u.created_at || '');
          return created >= dayStart && created < dayEnd;
        }).length;

        const dayMessages = (messagesResult.data || []).filter((m: { created_at: string }) => {
          const created = new Date(m.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        recentActivity.push({
          type: 'listings',
          count: dayListings,
          date,
        });
        recentActivity.push({
          type: 'users',
          count: dayUsers,
          date,
        });
        recentActivity.push({
          type: 'messages',
          count: dayMessages,
          date,
        });
      });

      // Ensure all numeric values are safe (no NaN, no undefined)
      const safeNumber = (value: number | null | undefined): number => {
        if (value == null || isNaN(value)) return 0;
        return Math.max(0, Math.round(value));
      };

      // Use filtered counts when date range is applied, otherwise use total counts
      const totalListingsCount = dateRange === 'all' 
        ? safeNumber(listingsResult.count) 
        : safeNumber(filteredListings.length);
      const totalUsersCount = dateRange === 'all'
        ? safeNumber(usersResult.count)
        : safeNumber(filteredUsers.length);
      const totalMessagesCount = dateRange === 'all'
        ? safeNumber(messagesResult.count)
        : safeNumber(filteredMessages.length);
      const totalWatchlistsCount = dateRange === 'all'
        ? safeNumber(watchlistsResult.count)
        : safeNumber(filteredWatchlists.length);

      setAnalytics({
        totalListings: totalListingsCount,
        activeListings: safeNumber(filteredListings.filter((l: { status?: string | null }) => (l.status || 'active') !== 'archived' && (l.status || 'active') !== 'draft').length),
        totalUsers: totalUsersCount,
        totalMessages: totalMessagesCount,
        totalWatchlists: totalWatchlistsCount,
        usersByRole: {
          investor: safeNumber(usersByRole.investor),
          wholesaler: safeNumber(usersByRole.wholesaler),
          admin: safeNumber(usersByRole.admin),
        },
        usersByTier: {
          free: safeNumber(usersByTier.free),
          basic: safeNumber(usersByTier.basic),
          pro: safeNumber(usersByTier.pro),
          enterprise: safeNumber(usersByTier.enterprise),
        },
        listingsByStatus,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Analytics Dashboard (Admin)</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90' | 'all')}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading analytics...</div>
      ) : (
        <div>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#007bff', fontSize: '32px' }}>{analytics.totalListings}</h3>
              <p style={{ margin: '0', color: '#6c757d' }}>Total Listings</p>
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>{analytics.activeListings} active</p>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '32px' }}>{analytics.totalUsers}</h3>
              <p style={{ margin: '0', color: '#6c757d' }}>Total Users</p>
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                {analytics.usersByRole.investor} investors, {analytics.usersByRole.wholesaler} wholesalers
              </p>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#ffc107', fontSize: '32px' }}>{analytics.totalMessages}</h3>
              <p style={{ margin: '0', color: '#6c757d' }}>Total Messages</p>
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>User inquiries</p>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#dc3545', fontSize: '32px' }}>{analytics.totalWatchlists}</h3>
              <p style={{ margin: '0', color: '#6c757d' }}>Saved Properties</p>
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>Watchlist items</p>
            </div>
          </div>

          {/* Breakdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Users by Tier</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Free</span>
                  <span style={{ fontWeight: 600 }}>{analytics.usersByTier.free}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Basic</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>{analytics.usersByTier.basic}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Pro</span>
                  <span style={{ fontWeight: 600, color: '#2563eb' }}>{analytics.usersByTier.pro}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Enterprise</span>
                  <span style={{ fontWeight: 600, color: '#7c3aed' }}>{analytics.usersByTier.enterprise}</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Listings by Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(analytics.listingsByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{status || 'active'}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
                {Object.keys(analytics.listingsByStatus).length === 0 && (
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>No status data available</span>
                )}
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Users by Role</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Investors</span>
                  <span style={{ fontWeight: 600, color: '#2563eb' }}>{analytics.usersByRole.investor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Wholesalers</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>{analytics.usersByRole.wholesaler}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280' }}>Admins</span>
                  <span style={{ fontWeight: 600, color: '#7c3aed' }}>{analytics.usersByRole.admin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Chart */}
          <div style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Recent Activity (Last 7 Days)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                const dayData = analytics.recentActivity.filter(a => a.date === dateStr);
                const listings = Math.max(0, dayData.find(a => a.type === 'listings')?.count || 0);
                const users = Math.max(0, dayData.find(a => a.type === 'users')?.count || 0);
                const messages = Math.max(0, dayData.find(a => a.type === 'messages')?.count || 0);
                const maxValue = Math.max(listings, users, messages, 1);
                // Guard against division by zero and NaN
                const safeHeight = (value: number, max: number): number => {
                  if (max <= 0 || isNaN(value) || isNaN(max)) return 0;
                  const percent = (value / max) * 100;
                  return isNaN(percent) ? 0 : Math.max(0, Math.min(100, percent));
                };
                
                return (
                
                return (
                  <div key={dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', height: '100%' }}>
                      <div style={{
                        flex: 1,
                        background: '#2563eb',
                        height: `${safeHeight(listings, maxValue)}%`,
                        minHeight: listings > 0 ? '4px' : '0',
                        borderRadius: '4px 4px 0 0'
                      }} title={`Listings: ${listings}`} />
                      <div style={{
                        flex: 1,
                        background: '#059669',
                        height: `${safeHeight(users, maxValue)}%`,
                        minHeight: users > 0 ? '4px' : '0',
                        borderRadius: '4px 4px 0 0'
                      }} title={`Users: ${users}`} />
                      <div style={{
                        flex: 1,
                        background: '#d97706',
                        height: `${safeHeight(messages, maxValue)}%`,
                        minHeight: messages > 0 ? '4px' : '0',
                        borderRadius: '4px 4px 0 0'
                      }} title={`Messages: ${messages}`} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#2563eb', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Listings</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#059669', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Users</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#d97706', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Messages</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <Link href="/admin/analytics/lead-conversion" style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'block'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📈 Lead Conversion Trends</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>View detailed conversion funnel and metrics</p>
            </Link>
            <Link href="/admin/reports" style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'block'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📊 Generate Reports</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Export data to CSV for analysis</p>
            </Link>
            <Link href="/admin/users" style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'block'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>👥 User Management</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>View and manage user accounts</p>
            </Link>
            <Link href="/admin/ai-usage" style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'block'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🤖 AI Usage</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Monitor AI tool usage and costs</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
