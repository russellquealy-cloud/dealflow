'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_id: string;
  created_at: string;
  user?: { email?: string; full_name?: string; company_name?: string };
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    userEmail: '',
  });
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const loadTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: HeadersInit = {};
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const response = await fetch(`/api/admin/support-tickets?${params.toString()}`, {
        headers,
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      alert('Please fill in subject and description');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/support-tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: newTicket.subject,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          userEmail: newTicket.userEmail || undefined,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTickets([data.ticket, ...tickets]);
        setShowCreateModal(false);
        setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium', userEmail: '' });
        alert('Ticket created successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to create ticket: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: { status?: string; priority?: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/support-tickets', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ticketId, ...updates }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(tickets.map(t => t.id === ticketId ? data.ticket : t));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to update ticket: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    }
  };

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

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
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
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading support tickets...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Support Tickets ({tickets.length})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  touchAction: 'manipulation'
                }}
              >
                Create Ticket
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
              {tickets.map((ticket) => (
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
                        <span>ID: #{ticket.id}</span>
                        <span>User: {ticket.user?.email || ticket.user?.full_name || ticket.user?.company_name || 'Unknown'}</span>
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        <span>Category: {ticket.category || 'General'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleUpdateTicket(ticket.id, { status: 'in_progress' })}
                          style={{
                            padding: '5px 10px',
                            minHeight: '32px',
                            background: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            touchAction: 'manipulation'
                          }}
                        >
                          Mark In Progress
                        </button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateTicket(ticket.id, { status: 'resolved' })}
                          style={{
                            padding: '5px 10px',
                            minHeight: '32px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            touchAction: 'manipulation'
                          }}
                        >
                          Resolve
                        </button>
                      )}
                      <select
                        value={ticket.priority}
                        onChange={(e) => handleUpdateTicket(ticket.id, { priority: e.target.value })}
                        style={{
                          padding: '5px 10px',
                          minHeight: '32px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
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
        onClick={() => setShowCreateModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Create Support Ticket</h2>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Subject *
            </label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Enter ticket subject..."
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

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Description *
            </label>
            <textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Enter ticket description..."
              rows={5}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    minHeight: '44px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    minHeight: '44px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              User Email (optional - leave empty to create for yourself)
            </label>
            <input
              type="email"
              value={newTicket.userEmail}
              onChange={(e) => setNewTicket({ ...newTicket, userEmail: e.target.value })}
              placeholder="user@example.com"
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium', userEmail: '' });
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
                onClick={handleCreateTicket}
                disabled={creating || !newTicket.subject || !newTicket.description}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: creating || !newTicket.subject || !newTicket.description ? '#9ca3af' : '#007bff',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: creating || !newTicket.subject || !newTicket.description ? 'not-allowed' : 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                {creating ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
