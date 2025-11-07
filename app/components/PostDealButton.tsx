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
      console.log('🔐 Post Deal button clicked');
      
      // Simple check - if we're on the page, user is likely authenticated
      // Just redirect directly - the page will handle auth check
      console.log('🔐 Redirecting to new listing page...');
      router.push('/my-listings/new');
      
    } catch (err) {
      console.error('🔐 Error in handlePostDeal:', err);
      // Fallback to direct navigation
      window.location.href = '/my-listings/new';
    } finally {
      // Don't set loading to false immediately - let navigation happen
      setTimeout(() => setIsLoading(false), 1000);
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
