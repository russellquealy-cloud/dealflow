'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Link from 'next/link';

export default function InvestorPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ type: string; company_name?: string } | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    city: '',
    state: '',
    investment_preferences: '',
    budget_range: '',
    bio: ''
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('Portal load timeout - setting loading to false');
      setLoading(false);
    }, 10000);

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          clearTimeout(timeoutId);
          router.push('/login?next=/portal/investor');
          return;
        }
        
        setUser(session.user);
        
        // Load existing profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
        } else if (profileData) {
          setProfile(profileData);
          setFormData({
            company_name: profileData.company_name || '',
            phone: profileData.phone || '',
            city: profileData.city || '',
            state: profileData.state || '',
            investment_preferences: profileData.investment_preferences || '',
            budget_range: profileData.budget_range || '',
            bio: profileData.bio || ''
          });
        }
        
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error in checkAuth:', err);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const profileData = {
        id: user.id,
        role: 'investor',
        segment: 'investor',
        tier: 'free', // Default to free tier
        company_name: formData.company_name,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        investment_preferences: formData.investment_preferences,
        budget_range: formData.budget_range,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      };

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        
        if (error) throw error;
      }

      alert('Profile updated successfully!');
      router.push('/account');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link 
          href="/account" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #6b7280', 
            borderRadius: 8,
            background: '#fff',
            color: '#374151',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Account
        </Link>
      </div>

      <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800 }}>💰 Investor Profile</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Set up your investor profile to start browsing deals and connecting with wholesalers.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          padding: 24,
          background: '#fff'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Business Information</h2>
          
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="Your company or investment firm name"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                  placeholder="Your city"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                  placeholder="Your state"
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          padding: 24,
          background: '#fff'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Investment Preferences</h2>
          
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Investment Preferences</label>
              <input
                type="text"
                value={formData.investment_preferences}
                onChange={(e) => setFormData({...formData, investment_preferences: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="e.g., Single-family homes, Multi-family, Commercial, Fix & Flip"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Budget Range</label>
              <select
                value={formData.budget_range}
                onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              >
                <option value="">Select budget range</option>
                <option value="under-100k">Under $100k</option>
                <option value="100k-250k">$100k - $250k</option>
                <option value="250k-500k">$250k - $500k</option>
                <option value="500k-1m">$500k - $1M</option>
                <option value="1m-plus">$1M+</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="Tell wholesalers about your investment experience and what you're looking for..."
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link 
            href="/account"
            style={{ 
              padding: '12px 24px', 
              border: '1px solid #6b7280', 
              borderRadius: 8, 
              background: '#fff', 
              color: '#374151', 
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            style={{ 
              padding: '12px 24px', 
              border: '1px solid #3b82f6', 
              borderRadius: 8, 
              background: '#3b82f6', 
              color: '#fff', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Save Profile
          </button>
        </div>
      </form>
    </main>
  );
}