import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { getAuthUser } from '@/lib/auth/server';

/**
 * GET /api/admin/diagnose
 * Diagnostic endpoint to check admin account status
 * Can be called by any authenticated user to check their own status
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, segment, tier, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    // Check if admin account exists by looking for profile with admin email
    // We'll query profiles and try to match by checking auth.users via RPC or by finding admin role
    // First, find any profile with admin role
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, role, segment, tier, created_at, updated_at')
      .or('role.eq.admin,segment.eq.admin')
      .limit(10);

    // Try to find admin@offaxisdeals.com profile
    // Note: We can't directly query auth.users, so we'll check profiles and note if we find admin role
    let adminProfile = null;
    let adminAccountInfo = null;
    
    // If we have admin profiles, check if any match the expected email
    // We'll need to use a different approach - check all profiles with admin role
    if (adminProfiles && adminProfiles.length > 0) {
      // For now, we'll just report what we found
      adminProfile = adminProfiles.find(p => p.role === 'admin' || p.segment === 'admin') || adminProfiles[0];
      adminAccountInfo = {
        found: true,
        count: adminProfiles.length,
        note: 'Found profiles with admin role. Cannot verify email without direct auth.users access.',
      };
    }

    // Check admin status using our helper logic
    const isCurrentUserAdmin = profile?.role === 'admin' || profile?.segment === 'admin';
    const isAdminAccountAdmin = adminProfile?.role === 'admin' || adminProfile?.segment === 'admin';

    return NextResponse.json({
      currentUser: {
        email: user.email,
        id: user.id,
        profile: profile || null,
        isAdmin: isCurrentUserAdmin,
        adminCheck: {
          roleCheck: profile?.role === 'admin',
          segmentCheck: profile?.segment === 'admin',
          combinedCheck: isCurrentUserAdmin,
        },
      },
      adminAccount: {
        exists: !!adminAccountInfo,
        email: 'admin@offaxisdeals.com',
        id: adminProfile?.id || null,
        profile: adminProfile || null,
        isAdmin: isAdminAccountAdmin,
        adminCheck: adminProfile ? {
          roleCheck: adminProfile.role === 'admin',
          segmentCheck: adminProfile.segment === 'admin',
          combinedCheck: isAdminAccountAdmin,
        } : null,
        info: adminAccountInfo,
      },
      diagnostic: {
        profileError: profileError?.message || null,
        profileExists: !!profile,
        adminAccountExists: !!adminAccountInfo,
        adminProfileExists: !!adminProfile,
        recommendations: [
          !adminProfile ? 'No profile found with admin role in profiles table' : null,
          adminProfile && !isAdminAccountAdmin ? 'Profile exists but role/segment is not set to admin' : null,
          profile && !isCurrentUserAdmin && user.email === 'admin@offaxisdeals.com' ? 'You are logged in as admin@offaxisdeals.com but your profile is not set to admin' : null,
          profile && !isCurrentUserAdmin ? `Your profile shows role="${profile.role}", segment="${profile.segment}" - neither is "admin"` : null,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Error in admin diagnose:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

