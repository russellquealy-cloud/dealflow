'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

type PostDealButtonProps = {
  fullWidth?: boolean;
};

export default function PostDealButton({ fullWidth = false }: PostDealButtonProps) {
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
        border: '1px solid #10b981',
        borderRadius: 10,
        padding: '10px 16px',
        background: '#10b981',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      Post a Deal
    </button>
  );
}
