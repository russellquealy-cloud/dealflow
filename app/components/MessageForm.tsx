'use client';

import { useState } from 'react';

interface MessageFormProps {
  listingId: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerName?: string;
  listingTitle?: string;
}

export default function MessageForm({ 
  ownerEmail, 
  ownerName, 
  listingTitle 
}: MessageFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create mailto link with message details
      const subject = `Interest in ${listingTitle || 'Property'}`;
      const body = `Hello ${ownerName || 'Property Owner'},

I am interested in your property listing.

My Details:
Name: ${senderName}
Email: ${senderEmail}
Phone: ${senderPhone}

Message:
${message}

Please contact me to discuss further.

Best regards,
${senderName}`;

      const mailtoLink = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      
      // Reset form
      setMessage('');
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setShowForm(false);
      
      alert('Email client opened with your message!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          background: '#0ea5e9',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          marginTop: 8
        }}
      >
        💬 Send Message
      </button>
    );
  }

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: 16,
      marginTop: 8
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
        Send Message to Owner
      </h4>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Your Name *
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Your Email *
          </label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Your Phone
          </label>
          <input
            type="tel"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
            placeholder="Enter your phone number"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              resize: 'vertical'
            }}
            placeholder="Tell the owner about your interest in this property..."
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? '#94a3b8' : '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              flex: 1
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{
              background: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
