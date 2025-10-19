'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function WholesalerPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ type: string; company_name?: string } | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    city: '',
    state: '',
    experience_years: '',
    specialties: '',
    bio: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=/portal/wholesaler');
        return;
      }
      
      setUser(session.user);
      
      // Load existing profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          company_name: profileData.company_name || '',
          phone: profileData.phone || '',
          city: profileData.city || '',
          state: profileData.state || '',
          experience_years: profileData.experience_years || '',
          specialties: profileData.specialties || '',
          bio: profileData.bio || ''
        });
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const profileData = {
        id: user.id,
        type: 'wholesaler',
        company_name: formData.company_name,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        experience_years: parseInt(formData.experience_years) || 0,
        specialties: formData.specialties,
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

      <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800 }}>🏠 Wholesaler Profile</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Set up your wholesaler profile to start posting deals and connecting with investors.
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
                placeholder="Your company or business name"
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
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Experience & Specialties</h2>
          
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Years of Experience</label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="5"
                min="0"
                max="50"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Specialties</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="e.g., Single-family homes, Multi-family, Commercial"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="Tell investors about your experience and what makes you unique..."
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
              border: '1px solid #f59e0b', 
              borderRadius: 8, 
              background: '#f59e0b', 
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