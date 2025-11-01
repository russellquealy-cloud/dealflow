// app/contact-sales/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    role: '',
    teamSize: '',
    needs: '',
    budget: '',
    timeline: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Error submitting form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>✅</div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1a', 
            marginBottom: '16px' 
          }}>
            Thank You!
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280', 
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>
            We&apos;ve received your inquiry and will get back to you within 24 hours with a custom quote and next steps.
          </p>
          <Link 
            href="/pricing"
            style={{
              background: 'transparent',
              color: '#3b82f6',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #3b82f6',
              display: 'inline-block'
            }}
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '800', 
              color: '#1a1a1a', 
              marginBottom: '16px' 
            }}>
              Contact Sales
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Get a custom quote for Enterprise features, team plans, or white-label solutions
            </p>
          </div>

          {/* Form */}
          <form id="contact-form" onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="">Select your role</option>
                  <option value="investor">Real Estate Investor</option>
                  <option value="wholesaler">Property Wholesaler</option>
                  <option value="agent">Real Estate Agent</option>
                  <option value="broker">Real Estate Broker</option>
                  <option value="developer">Property Developer</option>
                  <option value="fund-manager">Fund Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Team Size
                </label>
                <select
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="">Select team size</option>
                  <option value="1">Just me</option>
                  <option value="2-5">2-5 people</option>
                  <option value="6-20">6-20 people</option>
                  <option value="21-50">21-50 people</option>
                  <option value="50+">50+ people</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Primary Needs
                </label>
                <select
                  name="needs"
                  value={formData.needs}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="">Select primary needs</option>
                  <option value="team-seats">Team Seats & Management</option>
                  <option value="white-label">White-label Branding</option>
                  <option value="custom-integrations">Custom Integrations</option>
                  <option value="api-access">API Access</option>
                  <option value="data-feed">Off-market Data Feed</option>
                  <option value="crm-export">CRM Export</option>
                  <option value="dedicated-support">Dedicated Support</option>
                  <option value="multiple">Multiple Features</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Budget Range
                </label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="">Select budget range</option>
                  <option value="under-500">Under $500/month</option>
                  <option value="500-1000">$500 - $1,000/month</option>
                  <option value="1000-2500">$1,000 - $2,500/month</option>
                  <option value="2500-5000">$2,500 - $5,000/month</option>
                  <option value="5000+">$5,000+/month</option>
                  <option value="custom">Custom pricing needed</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Timeline
                </label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate</option>
                  <option value="1-month">Within 1 month</option>
                  <option value="3-months">Within 3 months</option>
                  <option value="6-months">Within 6 months</option>
                  <option value="planning">Just planning ahead</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '8px'
              }}>
                Additional Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us more about your specific requirements, use cases, or any questions you have..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>

          {/* Contact Info */}
          <div style={{ 
            marginTop: '40px', 
            padding: '24px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '12px'
            }}>
              Prefer to talk directly?
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              Schedule a call with our sales team
            </p>
            <a
              href="#contact-form"
              onClick={(e) => {
                e.preventDefault();
                // Scroll to the contact form
                const form = document.getElementById('contact-form');
                if (form) {
                  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Focus first input
                  const firstInput = form.querySelector('input') as HTMLInputElement;
                  if (firstInput) {
                    setTimeout(() => firstInput.focus(), 300);
                  }
                }
              }}
              style={{
                background: '#059669',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block',
                marginRight: '12px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              📝 Fill Out Form
            </a>
            <a 
              href="mailto:sales@offaxisdeals.com"
              style={{
                background: '#7c3aed',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block'
              }}
            >
              ✉️ Email Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
