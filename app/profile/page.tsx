import { redirect } from 'next/navigation';
import { getAuthUserServer } from '@/lib/auth/server';
import ProfileForm from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // Use getAuthUserServer directly with bearer token fallback support
  const { user, supabase, error } = await getAuthUserServer();
  
  if (!user || error) {
    console.log('[profile/page] Auth failed, redirecting to login', {
      hasUser: !!user,
      error: error?.message,
    });
    // Redirect to login - the login page will handle redirecting back if user is already authenticated
    redirect('/login?next=/profile');
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
