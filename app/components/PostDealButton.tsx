'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useState } from 'react';

export default function PostDealButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePostDeal = async () => {
    if (isLoading) return; // Prevent double-clicks
    
    try {
      setIsLoading(true);
      console.log('🔐 Post Deal button clicked - checking auth...');
      
      // Check auth BEFORE navigating to prevent redirect loop
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 Auth check error:', error);
        router.push('/login?next=/my-listings/new');
        return;
      }
      
      if (!session || !session.user) {
        console.log('🔐 No session, redirecting to login');
        router.push('/login?next=/my-listings/new');
        return;
      }
      
      console.log('🔐 Valid session, navigating to new listing page');
      // Use window.location to force full page reload and clear any stale state
      window.location.href = '/my-listings/new';
      
    } catch (err) {
      console.error('🔐 Error in handlePostDeal:', err);
      // Fallback to login
      window.location.href = '/login?next=/my-listings/new';
    }
    // Don't set loading to false - let navigation happen
  };

  return (
    <button 
      onClick={handlePostDeal}
      disabled={isLoading}
      style={{ 
        border: "1px solid #10b981",
        borderRadius: 10,
        padding: "8px 12px",
        background: isLoading ? "#6b7280" : "#10b981", 
        color: "#fff", 
        fontWeight: 600,
        cursor: isLoading ? "not-allowed" : "pointer"
      }}
    >
      {isLoading ? "Loading..." : "Post a Deal"}
    </button>
  );
}
