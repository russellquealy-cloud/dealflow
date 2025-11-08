'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function PostDealButton() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const handlePostDeal = () => {
    if (loading) return;

    if (!session) {
      router.push('/login?next=/my-listings/new');
      return;
    }

    router.push('/my-listings/new');
  };

  return (
    <button 
      onClick={handlePostDeal}
      style={{ 
        border: "1px solid #10b981",
        borderRadius: 10,
        padding: "8px 12px",
        background: "#10b981", 
        color: "#fff", 
        fontWeight: 600,
        cursor: "pointer"
      }}
    >
      Post a Deal
    </button>
  );
}
