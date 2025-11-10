'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import type { Session } from '@supabase/supabase-js';

function EmailNotificationInfo() {
  const [email, setEmail] = useState<string>('');
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setEmail(session?.user?.email || 'your email');
    });
  }, []);

  return (
    <div style={{
      marginTop: 32,
      padding: 20,
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: 12
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
        📧 Email Notifications
      </div>
      <div style={{ fontSize: 14, color: '#0c4a6e' }}>
        All enabled alerts will be sent to your registered email address: <strong>{email}</strong>. You will also receive in-app notifications when available.
      </div>
    </div>
  );
}

// Alert types for each role
const INVESTOR_ALERTS = [
  'New Off-Market Property',
  'Price Drop',
  'ROI Opportunity',
  'Sold/Under Contract',
  'Wholesaler Verified',
  'Area Market Shift',
  'Subscription Renewal',
  'Message/Offer Response'
];

const WHOLESALER_ALERTS = [
  'Buyer Interest',
  'Lead Message',
  'Listing Performance',
  'Repair Estimate Ready',
  'Property Verification',
  'Market Trend',
  'Subscription Renewal',
  'Feedback/Rating'
];

interface UserAlert {
  id: string;
  user_id: string;
  role: 'investor' | 'wholesaler';
  alert_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'investor' | 'wholesaler' | null>(null);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?next=/alerts');
        return;
      }

      try {
        // Get user role from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('segment, role')
          .eq('id', session.user.id)
          .single();

        const role = (profile?.segment || profile?.role || 'investor') as 'investor' | 'wholesaler';
        setUserRole(role);

        // Load user alerts
        const { data: userAlerts, error } = await supabase
          .from('user_alerts')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('role', role)
          .order('alert_type', { ascending: true });

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading alerts:', error);
        }

        // If no alerts exist, create defaults
        const alertTypes = role === 'investor' ? INVESTOR_ALERTS : WHOLESALER_ALERTS;
        const existingTypes = new Set(userAlerts?.map((a: UserAlert) => a.alert_type) || []);

        const missingAlerts = alertTypes.filter(type => !existingTypes.has(type));
        
        if (missingAlerts.length > 0) {
          const newAlerts = missingAlerts.map(alertType => ({
            user_id: session.user.id,
            role,
            alert_type: alertType,
            is_enabled: true
          }));

          const { data: inserted } = await supabase
            .from('user_alerts')
            .insert(newAlerts)
            .select();

          setAlerts([
            ...(userAlerts || []),
            ...(inserted || [])
          ]);
        } else {
          setAlerts(userAlerts || []);
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const toggleAlert = async (alertId: string, currentValue: boolean) => {
    if (saving[alertId]) return;

    setSaving(prev => ({ ...prev, [alertId]: true }));

    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_enabled: !currentValue })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_enabled: !currentValue } : a
      ));
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Failed to update alert preference');
    } finally {
      setSaving(prev => ({ ...prev, [alertId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div>Loading alerts...</div>
      </div>
    );
  }

  const alertTypes = userRole === 'investor' ? INVESTOR_ALERTS : WHOLESALER_ALERTS;

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>
          Notification Settings
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Manage how and when you receive alerts for {userRole === 'investor' ? 'investment opportunities' : 'your listings'}
        </p>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => router.push('/settings/notifications')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Open Notification Preferences
          </button>
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24
      }}>
        {alertTypes.map((alertType) => {
          const alert = alerts.find(a => a.alert_type === alertType);
          const isEnabled = alert?.is_enabled ?? true;
          const alertId = alert?.id;

          return (
            <div
              key={alertType}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                  {alertType}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                  {getAlertDescription(alertType)}
                </div>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: 48,
                height: 24,
                cursor: saving[alertId || ''] ? 'not-allowed' : 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => alertId && toggleAlert(alertId, isEnabled)}
                  disabled={!alertId || saving[alertId || '']}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isEnabled ? '#10b981' : '#d1d5db',
                  borderRadius: 24,
                  transition: 'background 0.3s ease',
                  opacity: saving[alertId || ''] ? 0.6 : 1
                }}>
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: isEnabled ? 26 : 2,
                    width: 20,
                    height: 20,
                    background: '#fff',
                    borderRadius: '50%',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          );
        })}
      </div>

      <EmailNotificationInfo />
    </main>
  );
}

function getAlertDescription(alertType: string): string {
  const descriptions: Record<string, string> = {
    'New Off-Market Property': 'Get notified when new properties match your saved search criteria',
    'Price Drop': 'Alert when a property you\'re tracking reduces its price',
    'ROI Opportunity': 'Notifications for properties with ROI above your threshold',
    'Sold/Under Contract': 'Alert when a saved property changes to sold or under contract',
    'Wholesaler Verified': 'Get notified when a wholesaler you follow gets verified or posts new deals',
    'Area Market Shift': 'Alerts when median ARV or market activity changes in followed areas',
    'Subscription Renewal': 'Reminders about upcoming renewals and payment issues',
    'Message/Offer Response': 'Get notified when wholesalers reply to your messages or offers',
    'Buyer Interest': 'Alerts when investors view or save your listings',
    'Lead Message': 'Get notified when investors send messages or make offers',
    'Listing Performance': 'Weekly summary of views, saves, and messages for your listings',
    'Repair Estimate Ready': 'Notification when AI analyzer finishes calculating repair costs',
    'Property Verification': 'Alerts when listings pass verification or need updates',
    'Market Trend': 'Notifications when comparable sales shift significantly in your area',
    'Feedback/Rating': 'Alert when investors leave feedback or ratings on your listings'
  };
  return descriptions[alertType] || 'Custom alert preference';
}
