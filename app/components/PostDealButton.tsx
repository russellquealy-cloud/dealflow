'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useState } from 'react';

export default function PostDealButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePostDeal = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Post Deal button clicked - checking authentication...');
      
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔐 Session check result:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: error?.message
      });
      
      // Check cookies
      const cookies = document.cookie.split(';').filter(c => c.includes('supabase'));
      console.log('🍪 Supabase cookies found:', cookies.length > 0 ? cookies : 'None');
      
      if (error) {
        console.error('🔐 Session error:', error);
        router.push('/login?next=/my-listings/new');
        return;
      }
      
      if (!session || !session.user) {
        console.log('🔐 No session found, redirecting to login');
        router.push('/login?next=/my-listings/new');
        return;
      }
      
      console.log('🔐 Valid session found, redirecting to new listing page');
      
      // Force refresh the page to ensure server-side session is synced
      window.location.href = '/my-listings/new';
      
    } catch (err) {
      console.error('🔐 Error in handlePostDeal:', err);
      router.push('/login?next=/my-listings/new');
    } finally {
      setIsLoading(false);
    }
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
