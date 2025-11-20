import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side: Check if a user is an admin by checking both role and segment fields
 * Some accounts may have admin in segment instead of role
 * This function is meant to be used in server components and API routes
 */
export async function isAdmin(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<boolean> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('role, segment')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('isAdmin check error', {
        error: error.message,
        code: error.code,
        userId,
      });
      return false;
    }

    if (!profile) {
      console.warn('isAdmin check: No profile found', { userId });
      return false;
    }

    const isAdminUser = profile.role === 'admin' || profile.segment === 'admin';
    
    console.log('isAdmin check result', {
      userId,
      role: profile.role,
      segment: profile.segment,
      isAdmin: isAdminUser,
    });

    // Check both role and segment fields
    return isAdminUser;
  } catch (error) {
    console.error('Error checking admin status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return false;
  }
}

/**
 * Client-side helper to check if current user is admin
 * This is a pure function that can be used in client components
 */
export function checkIsAdminClient(profile: { role?: string | null; segment?: string | null } | null | undefined): boolean {
  if (!profile) return false;
  return profile.role === 'admin' || profile.segment === 'admin';
}
