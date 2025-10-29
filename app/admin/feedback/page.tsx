'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from('user_feedback')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setFeedback(data || []);
      } catch (error) {
        console.error('Error loading feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return '#dc3545';
      case 'feature_request': return '#007bff';
      case 'improvement': return '#28a745';
      case 'general': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#007bff';
      case 'under_review': return '#ffc107';
      case 'in_progress': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Admin Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px' }}>Feedback System (Admin)</h1>

      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠ Feature Status: Stub Implementation</h3>
        <p style={{ margin: '0', color: '#856404' }}>
          This is a placeholder implementation for testing. In production, this would include:
        </p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', color: '#856404' }}>
          <li>Real feedback collection from users</li>
          <li>Feature request tracking and voting</li>
          <li>Bug report management</li>
          <li>User satisfaction surveys</li>
        </ul>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading feedback...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>User Feedback ({feedback.length})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Create Feedback
              </button>
              <button style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Export Feedback
              </button>
            </div>
          </div>

          {feedback.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0', color: '#6c757d' }}>No feedback found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {feedback.map((item: Record<string, unknown>) => (
                <div key={String(item.id)} style={{
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <h4 style={{ margin: '0' }}>{String(item.title) || 'Untitled Feedback'}</h4>
                        <span style={{
                          padding: '4px 8px',
                          background: getTypeColor(String(item.type)),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {String(item.type)?.toUpperCase() || 'GENERAL'}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: getStatusColor(String(item.status)),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {String(item.status)?.toUpperCase() || 'NEW'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
                        {String(item.description) || 'No description'}
                      </p>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6c757d' }}>
                        <span>User: {String(item.user_email) || 'Anonymous'}</span>
                        <span>Created: {new Date(String(item.created_at)).toLocaleDateString()}</span>
                        <span>Priority: {String(item.priority) || 'Medium'}</span>
                        {item.votes ? <span>Votes: {String(item.votes)}</span> : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        View
                      </button>
                      <button style={{
                        padding: '5px 10px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        Upvote
                      </button>
                      <button style={{
                        padding: '5px 10px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Stats */}
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>{feedback.filter((f: Record<string, unknown>) => f.type === 'bug').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Bug Reports</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{feedback.filter((f: Record<string, unknown>) => f.type === 'feature_request').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Feature Requests</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>{feedback.filter((f: Record<string, unknown>) => f.status === 'completed').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Completed</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>{feedback.length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Total Feedback</p>
        </div>
      </div>
    </div>
  );
}
