import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/lib/auth/server';
import ProfileForm from '@/components/ProfileForm';

export default async function ProfilePage() {
  // Use consistent auth helper that prevents redirect loops
  const { user, supabase } = await requireAuthServer('/profile');
  
  if (!user) {
    // requireAuthServer already handles redirect, but TypeScript needs this check
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Profile</h1>
      <ProfileForm initial={profile ?? undefined} />
    </main>
  );
}
