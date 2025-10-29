'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#dc3545';
      case 'in_progress': return '#ffc107';
      case 'resolved': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
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

      <h1 style={{ marginBottom: '30px' }}>Support Center (Admin)</h1>

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
          <li>Real-time ticket management system</li>
          <li>Email integration for ticket creation</li>
          <li>Priority support for Pro users</li>
          <li>Knowledge base integration</li>
        </ul>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading support tickets...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Support Tickets ({tickets.length})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Create Ticket
              </button>
              <button style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Bulk Actions
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0', color: '#6c757d' }}>No support tickets found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {tickets.map((ticket: Record<string, unknown>) => (
                <div key={String(ticket.id)} style={{
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <h4 style={{ margin: '0' }}>{String(ticket.subject) || 'Untitled Ticket'}</h4>
                        <span style={{
                          padding: '4px 8px',
                          background: getStatusColor(String(ticket.status)),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {String(ticket.status)?.toUpperCase() || 'OPEN'}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: getPriorityColor(String(ticket.priority)),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {String(ticket.priority)?.toUpperCase() || 'MEDIUM'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
                        {String(ticket.description) || 'No description'}
                      </p>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#6c757d' }}>
                        <span>ID: #{String(ticket.id)}</span>
                        <span>User: {String(ticket.user_email) || 'Unknown'}</span>
                        <span>Created: {new Date(String(ticket.created_at)).toLocaleDateString()}</span>
                        <span>Category: {String(ticket.category) || 'General'}</span>
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
                        Reply
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
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>{tickets.filter((t: Record<string, unknown>) => t.status === 'open').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Open Tickets</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>{tickets.filter((t: Record<string, unknown>) => t.status === 'in_progress').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>In Progress</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>{tickets.filter((t: Record<string, unknown>) => t.status === 'resolved').length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Resolved</p>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{tickets.length}</h3>
          <p style={{ margin: '0', color: '#6c757d' }}>Total Tickets</p>
        </div>
      </div>
    </div>
  );
}
