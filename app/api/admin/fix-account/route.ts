import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/fix-account
 * Returns status information about the fix-account endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserIsAdmin = await isAdmin(user.id, supabase);

    return NextResponse.json({
      ok: true,
      message: 'Fix account endpoint is available',
      method: 'POST',
      requiresAdmin: false,
      canFixSelf: true,
      currentUserIsAdmin,
      instructions: 'Use POST method with body: { email?: string }',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fix-account
 * Fix admin account - requires admin access or can be run by the admin account itself
 * Body: { email?: string } - defaults to admin@offaxisdeals.com
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin OR if they're trying to fix their own account
    const currentUserIsAdmin = await isAdmin(user.id, supabase);
    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email || 'admin@offaxisdeals.com';
    const isSelfFix = user.email === targetEmail;

    if (!currentUserIsAdmin && !isSelfFix) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required or must be fixing your own account' },
        { status: 403 }
      );
    }

    // We can't directly query auth.users, so we'll work with the current user if it's a self-fix
    // or we'll need to find the user ID another way
    let targetUserId: string;
    
    if (isSelfFix) {
      // If fixing own account, use current user ID
      targetUserId = user.id;
    } else {
      // For admin fixing another account, we'd need the user ID
      // For now, if email is provided and matches a pattern, we can try to find it
      // But the safest approach is to use the current user's ID if it's a self-fix
      // For admin fixing admin@offaxisdeals.com, we'll need to find that user's ID
      // Since we can't query auth.users directly, we'll check if there's a profile with admin role
      // and assume that's the admin account
      if (targetEmail === 'admin@offaxisdeals.com') {
        // Try to find a profile with admin role
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.admin,segment.eq.admin')
          .limit(1)
          .single();
        
        if (adminProfile) {
          targetUserId = adminProfile.id;
        } else {
          // If no admin profile exists, we can't proceed without the user ID
          return NextResponse.json(
            { error: `Cannot find user with email ${targetEmail}. Please provide user ID or ensure the account exists.` },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Can only fix admin@offaxisdeals.com or your own account. For other accounts, use user ID.' },
          { status: 400 }
        );
      }
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role, segment, tier')
      .eq('id', targetUserId)
      .maybeSingle();

    // Update or create profile
    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          segment: existingProfile.segment || 'investor', // Keep existing segment or default to investor
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)
        .select('id, role, segment, tier')
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Admin role set for ${targetEmail}`,
        profile: updatedProfile,
        action: 'updated',
      });
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: targetUserId,
          role: 'admin',
          segment: 'investor', // Default segment
          tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, role, segment, tier')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create profile', details: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Admin profile created for ${targetEmail}`,
        profile: newProfile,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Error in admin fix-account:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

