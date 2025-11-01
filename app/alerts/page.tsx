'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';

interface Alert {
  id: string;
  type: 'price' | 'location' | 'property_type' | 'custom';
  criteria: Record<string, unknown>;
  active: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [alertType, setAlertType] = useState<'price' | 'location' | 'property_type' | 'custom'>('price');
  const [alertCriteria, setAlertCriteria] = useState<Record<string, unknown>>({
    maxPrice: undefined,
    location: '',
    property_type: '',
  });

  useEffect(() => {
    const loadAlerts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?next=/alerts');
        return;
      }

      try {
        const response = await fetch('/api/alerts', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        } else if (response.status === 401) {
          router.push('/login?next=/alerts');
          return;
        } else {
          console.error('Error loading alerts:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [router]);

  const handleCreate = async () => {
    if (!alertCriteria || Object.keys(alertCriteria).length === 0) {
      alert('Please configure alert criteria');
      return;
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: alertType,
          criteria: alertCriteria,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts([...alerts, data.alert]);
        setAlertType('price');
        setAlertCriteria({});
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alert.id,
          active: !alert.active,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(alerts.map(a => a.id === alert.id ? data.alert : a));
      }
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const renderCriteriaForm = () => {
    switch (alertType) {
      case 'price':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Max Price</label>
              <input
                type="number"
                placeholder="e.g., 200000"
                value={(typeof alertCriteria.maxPrice === 'number' ? alertCriteria.maxPrice : '') || ''}
                onChange={(e) => setAlertCriteria({ ...alertCriteria, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>City/State (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Miami, FL"
                value={(alertCriteria.location as string) || ''}
                onChange={(e) => setAlertCriteria({ ...alertCriteria, location: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </div>
          </div>
        );
      case 'location':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Location</label>
            <input
              type="text"
              placeholder="e.g., Miami, FL or ZIP code"
              value={(alertCriteria.location as string) || ''}
              onChange={(e) => setAlertCriteria({ ...alertCriteria, location: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </div>
        );
      case 'property_type':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Property Type</label>
            <select
              value={(alertCriteria.property_type as string) || ''}
              onChange={(e) => setAlertCriteria({ ...alertCriteria, property_type: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value="">Select type...</option>
              <option value="single-family">Single Family</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="multi-family">Multi-Family</option>
            </select>
          </div>
        );
      case 'custom':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Custom Criteria (JSON)</label>
            <textarea
              placeholder='{"minBeds": 3, "maxPrice": 200000, "city": "Miami"}'
              value={JSON.stringify(alertCriteria, null, 2)}
              onChange={(e) => {
                try {
                  setAlertCriteria(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}
              rows={4}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div>Loading alerts...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>Property Alerts</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
            Get notified when properties matching your criteria are added
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          background: '#fff'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Create New Alert</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Alert Type</label>
            <select
              value={alertType}
              onChange={(e) => {
                setAlertType(e.target.value as Alert['type']);
                setAlertCriteria({});
              }}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value="price">Price Alert</option>
              <option value="location">Location Alert</option>
              <option value="property_type">Property Type Alert</option>
              <option value="custom">Custom Criteria</option>
            </select>
          </div>
          {renderCriteriaForm()}
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              onClick={handleCreate}
              style={{
                padding: '12px 24px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Alert
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setAlertType('price');
                setAlertCriteria({});
              }}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          background: '#fff'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>No Alerts Set</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Create alerts to get notified when properties matching your criteria are added.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
                background: alert.active ? '#fff' : '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                    {alert.type.replace('_', ' ')} Alert
                  </h3>
                  {!alert.active && (
                    <span style={{
                      padding: '2px 8px',
                      background: '#6b7280',
                      color: 'white',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                  Created {new Date(alert.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  {JSON.stringify(alert.criteria).substring(0, 100)}...
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleToggleActive(alert)}
                  style={{
                    padding: '8px 16px',
                    background: alert.active ? '#f3f4f6' : '#059669',
                    color: alert.active ? '#6b7280' : 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {alert.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#fff',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

