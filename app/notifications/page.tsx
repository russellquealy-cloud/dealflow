'use client';

import { useEffect, useMemo, useState } from 'react';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  listing_id: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications?limit=50', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const payload: NotificationRecord[] = await response.json();
        if (isMounted) {
          setNotifications(payload);
          setError(null);
        }

        const unreadIds = payload
          .filter((item) => !item.is_read)
          .map((item) => item.id);

        if (unreadIds.length > 0) {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ids: unreadIds, is_read: true }),
          }).catch((patchError) => {
            console.error('Failed to mark notifications as read', patchError);
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications:updated'));
          }
        }
      } catch (requestError) {
        console.error('Error loading notifications', requestError);
        if (isMounted) {
          setError('Unable to load notifications right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasNotifications = notifications.length > 0;

  const content = useMemo(() => {
    if (loading) {
      return (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            background: '#fff',
            color: '#6b7280',
          }}
        >
          Loading notifications…
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 24,
            background: '#fee2e2',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      );
    }

    if (!hasNotifications) {
      return (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
            background: '#fff',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          You&apos;re all caught up. New notifications will appear here.
        </div>
      );
    }

    return (
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {notifications.map((notification, index) => {
          const last = index === notifications.length - 1;
          const createdAt = new Date(notification.created_at);
          const timestamp = createdAt.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });

          return (
            <div
              key={notification.id}
              style={{
                padding: '18px 24px',
                borderBottom: last ? 'none' : '1px solid #e5e7eb',
                background: notification.is_read ? '#fff' : '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: notification.is_read ? 600 : 700,
                    color: '#111827',
                    marginRight: 12,
                  }}
                >
                  {notification.title}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{timestamp}</div>
              </div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                {notification.body.length > 220
                  ? `${notification.body.slice(0, 217)}…`
                  : notification.body}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [loading, error, hasNotifications, notifications]);

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
          Notifications
        </h1>
        <p style={{ margin: '12px 0 0 0', color: '#6b7280', fontSize: 15 }}>
          Stay informed about investor activity and account updates.
        </p>
      </div>
      {content}
    </div>
  );
}


