'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FeedbackPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'feedback',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ type: 'feedback', subject: '', message: '' });
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Error sending feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: 'bug' | 'feedback' | 'feature') => {
    setFormData({ ...formData, type, subject: '' });
  };

  const getSubjectPlaceholder = () => {
    switch (formData.type) {
      case 'bug':
        return 'Describe the bug you encountered...';
      case 'feature':
        return 'Describe the feature you would like to see...';
      default:
        return 'Share your feedback...';
    }
  };

  if (isSubmitted) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '80px auto',
        padding: '40px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#059669',
          marginBottom: '20px'
        }}>
          Thank You!
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          marginBottom: '32px',
          lineHeight: '1.5'
        }}>
          Your {formData.type === 'bug' ? 'bug report' : formData.type === 'feature' ? 'feature request' : 'feedback'} has been submitted. We&apos;ll review it and get back to you if needed.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/" style={{
            background: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            Back to Home
          </Link>
          <button
            onClick={() => setIsSubmitted(false)}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '40px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{
          display: 'inline-block',
          marginBottom: '20px',
          color: '#3b82f6',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ← Back to Home
        </Link>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '10px'
        }}>
          Share Your Feedback
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          Help us improve Off Axis Deals. Report bugs, request features, or share your thoughts.
        </p>
      </div>

      {/* Type Selection */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        background: '#f1f5f9',
        padding: '8px',
        borderRadius: '12px'
      }}>
        <button
          type="button"
          onClick={() => handleTypeChange('bug')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: formData.type === 'bug' ? 'white' : 'transparent',
            color: formData.type === 'bug' ? '#1a1a1a' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: formData.type === 'bug' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            fontSize: '14px'
          }}
        >
          🐛 Report Bug
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('feedback')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: formData.type === 'feedback' ? 'white' : 'transparent',
            color: formData.type === 'feedback' ? '#1a1a1a' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: formData.type === 'feedback' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            fontSize: '14px'
          }}
        >
          💬 Feedback
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('feature')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: formData.type === 'feature' ? 'white' : 'transparent',
            color: formData.type === 'feature' ? '#1a1a1a' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: formData.type === 'feature' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            fontSize: '14px'
          }}
        >
          ✨ Request Feature
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="subject" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
            Subject {formData.type === 'bug' ? '(e.g., "Map not loading on mobile")' : formData.type === 'feature' ? '(e.g., "Add export to Excel")' : '(optional)'}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder={formData.type === 'bug' ? 'Brief description of the bug' : formData.type === 'feature' ? 'Feature name' : 'Subject (optional)'}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '16px',
              color: '#333',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="message" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
            {formData.type === 'bug' ? 'Bug Details' : formData.type === 'feature' ? 'Feature Description' : 'Your Feedback'} *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={8}
            required
            placeholder={getSubjectPlaceholder()}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '16px',
              color: '#333',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.message.trim()}
          style={{
            width: '100%',
            padding: '15px 20px',
            background: isSubmitting || !formData.message.trim() ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: isSubmitting || !formData.message.trim() ? 'not-allowed' : 'pointer',
            opacity: isSubmitting || !formData.message.trim() ? 0.7 : 1,
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSubmitting ? 'Sending...' : `Submit ${formData.type === 'bug' ? 'Bug Report' : formData.type === 'feature' ? 'Feature Request' : 'Feedback'}`}
        </button>
      </form>

      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.6'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>📧 Need immediate help?</p>
        <p style={{ margin: 0 }}>
          Email us directly at <a href="mailto:customerservice@offaxisdeals.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>customerservice@offaxisdeals.com</a>
        </p>
      </div>
    </div>
  );
}

