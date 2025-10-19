import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Profile</h1>
      <ProfileForm initial={profile ?? undefined} />
    </main>
  );
}
