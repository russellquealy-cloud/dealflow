'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type PreferenceKey =
  | 'buyer_interest'
  | 'lead_message'
  | 'listing_performance'
  | 'repair_estimate_ready'
  | 'property_verification'
  | 'market_trend'
  | 'subscription_renewal'
  | 'feedback_rating';

type PreferencesState = Record<PreferenceKey, boolean>;

type PreferenceResponseRow = PreferencesState & {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_PREFERENCES: PreferencesState = {
  buyer_interest: true,
  lead_message: true,
  listing_performance: true,
  repair_estimate_ready: true,
  property_verification: true,
  market_trend: true,
  subscription_renewal: true,
  feedback_rating: true,
};

const PREFERENCE_ITEMS: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
}> = [
  {
    key: 'buyer_interest',
    title: 'Buyer Interest',
    description: 'Alerts when investors view or save your listings',
  },
  {
    key: 'lead_message',
    title: 'Lead Message',
    description: 'Get notified when investors send messages or make offers',
  },
  {
    key: 'listing_performance',
    title: 'Listing Performance',
    description:
      'Weekly summary of views, saves, and messages for your listings',
  },
  {
    key: 'repair_estimate_ready',
    title: 'Repair Estimate Ready',
    description:
      'Notification when AI analyzer finishes calculating repair costs',
  },
  {
    key: 'property_verification',
    title: 'Property Verification',
    description: 'Alerts when listings pass verification or need updates',
  },
  {
    key: 'market_trend',
    title: 'Market Trend',
    description:
      'Notifications when comparable sales shift significantly in your area',
  },
  {
    key: 'subscription_renewal',
    title: 'Subscription Renewal',
    description: 'Reminders about upcoming renewals and payment issues',
  },
  {
    key: 'feedback_rating',
    title: 'Feedback/Rating',
    description: 'Alert when investors leave feedback or ratings on your listings',
  },
];

function extractPreferences(row: unknown): PreferencesState {
  if (typeof row !== 'object' || row === null) {
    return DEFAULT_PREFERENCES;
  }

  const record = row as Record<string, unknown>;
  const nextState: PreferencesState = { ...DEFAULT_PREFERENCES };

  (Object.keys(nextState) as PreferenceKey[]).forEach((key) => {
    const value = record[key];
    if (typeof value === 'boolean') {
      nextState[key] = value;
    }
  });

  return nextState;
}

function Toggle({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        width: 52,
        height: 28,
        borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.1)',
        background: checked ? '#2563eb' : '#e5e7eb',
        transition: 'background 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        padding: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 26 : 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<PreferencesState>(DEFAULT_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Partial<Record<PreferenceKey, boolean>>
  >({});

  const effectivePreferences = useMemo(() => {
    const merged: PreferencesState = { ...preferences };
    Object.entries(optimisticUpdates).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        merged[key as PreferenceKey] = value;
      }
    });
    return merged;
  }, [preferences, optimisticUpdates]);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications/preferences', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load notification preferences.');
        }

        const payload: PreferenceResponseRow = await response.json();
        if (isMounted) {
          setPreferences(extractPreferences(payload));
          setError(null);
        }
      } catch (requestError) {
        console.error('Error loading notification preferences', requestError);
        if (isMounted) {
          setError('Unable to load your notification preferences right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  const updatePreference = useCallback(
    async (key: PreferenceKey, value: boolean) => {
      setOptimisticUpdates((prev) => ({ ...prev, [key]: value }));
      try {
        const response = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to update preference');
        }

        const payload: PreferenceResponseRow = await response.json();
        setPreferences(extractPreferences(payload));
        setError(null);
      } catch (requestError) {
        console.error('Error updating notification preference', requestError);
        setOptimisticUpdates((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        alert('Unable to update this preference. Please try again.');
      } finally {
        setOptimisticUpdates((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    []
  );

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '32px 24px 48px 24px',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Notification Settings
        </h1>
        <p style={{ margin: '12px 0 0 0', color: '#6b7280', fontSize: 15 }}>
          Choose which alerts you want to receive about your listings and account.
        </p>
      </div>

      {loading ? (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            background: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Loading preferences…
          </div>
          <div style={{ color: '#6b7280' }}>
            Please wait while we fetch your current settings.
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          {error && (
            <div
              style={{
                padding: 16,
                background: '#fef3c7',
                color: '#92400e',
                borderBottom: '1px solid #fcd34d',
              }}
            >
              {error}
            </div>
          )}

          {PREFERENCE_ITEMS.map(({ key, title, description }, index) => {
            const last = index === PREFERENCE_ITEMS.length - 1;
            const checked = effectivePreferences[key];
            const isUpdating = Object.prototype.hasOwnProperty.call(
              optimisticUpdates,
              key
            );

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: last ? 'none' : '1px solid #e5e7eb',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {title}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.5 }}>
                    {description}
                  </div>
                </div>
                <Toggle
                  checked={checked}
                  disabled={isUpdating}
                  onClick={() => updatePreference(key, !checked)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


