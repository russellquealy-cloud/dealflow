#!/usr/bin/env node

/**
 * Fix Profile Inconsistencies
 * This script corrects segment, role, and tier mismatches in profiles
 * 
 * Run with: node scripts/fix-profiles.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixProfiles() {
  console.log('🔧 Starting profile fix script...\n');

  try {
    // Fetch all profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, segment, tier, subscription_tier, membership_tier, type');

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      process.exit(1);
    }

    console.log(`📊 Found ${profiles.length} profiles to check\n`);

    const updates = [];
    let fixedCount = 0;

    for (const profile of profiles) {
      const updatesForProfile = {};
      let needsUpdate = false;

      // Fix 1: Admin users - keep role=admin but set segment to 'investor' (constraint doesn't allow 'admin')
      // Admin users are identified by role='admin', not by segment
      if (profile.role === 'admin' && profile.segment !== 'investor') {
        updatesForProfile.segment = 'investor'; // Valid value for constraint
        needsUpdate = true;
        console.log(`  🔧 ${profile.id}: Fixing admin - setting segment=investor (role=admin identifies admin)`);
      }

      // Fix 2: Ensure segment matches role (for non-admin users)
      if (profile.role && profile.role !== 'admin') {
        if (!profile.segment || profile.segment !== profile.role) {
          // Use role as the source of truth if segment doesn't match
          updatesForProfile.segment = profile.role;
          needsUpdate = true;
          console.log(`  🔧 ${profile.id}: Fixing segment mismatch - setting segment=${profile.role} (was ${profile.segment || 'null'})`);
        }
      }

      // Fix 3: If segment exists but role doesn't, copy segment to role
      if (profile.segment && (!profile.role || profile.role !== profile.segment)) {
        // Don't override admin role
        if (profile.segment !== 'admin' || !profile.role) {
          updatesForProfile.role = profile.segment;
          needsUpdate = true;
          console.log(`  🔧 ${profile.id}: Fixing role mismatch - setting role=${profile.segment} (was ${profile.role || 'null'})`);
        }
      }

      // Fix 4: Ensure tier is set (default to free if not set)
      if (!profile.tier) {
        // Try to infer from subscription_tier or membership_tier
        const inferredTier = profile.subscription_tier || profile.membership_tier || 'free';
        updatesForProfile.tier = inferredTier.toLowerCase();
        needsUpdate = true;
        console.log(`  🔧 ${profile.id}: Setting missing tier=${updatesForProfile.tier}`);
      }

      // Fix 5: Ensure type matches role/segment (for backward compatibility)
      if (profile.segment && (!profile.type || profile.type !== profile.segment)) {
        updatesForProfile.type = profile.segment;
        needsUpdate = true;
        console.log(`  🔧 ${profile.id}: Fixing type - setting type=${profile.segment} (was ${profile.type || 'null'})`);
      }

      if (needsUpdate) {
        updatesForProfile.updated_at = new Date().toISOString();
        updates.push({
          id: profile.id,
          updates: updatesForProfile
        });
        fixedCount++;
      }
    }

    console.log(`\n📝 Found ${fixedCount} profiles that need updates\n`);

    if (updates.length === 0) {
      console.log('✅ All profiles are correct! No updates needed.');
      return;
    }

    // Apply updates
    console.log('🔄 Applying updates...\n');
    
    for (const { id, updates: profileUpdates } of updates) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (updateError) {
        console.error(`  ❌ Error updating profile ${id}:`, updateError);
      } else {
        console.log(`  ✅ Updated profile ${id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} profiles!`);

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...\n');
    const { data: verifyProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role, segment, tier, type')
      .order('id');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('📊 Updated Profiles:');
      verifyProfiles.forEach(p => {
        // Admin users: role='admin' is what matters, segment can be 'investor' or 'wholesaler'
        // Non-admin users: segment should match role
        const isAdmin = p.role === 'admin';
        const isValid = isAdmin 
          ? (p.segment === 'investor' || p.segment === 'wholesaler') && p.tier
          : (p.segment && p.segment === p.role && p.tier);
        const status = isValid ? '✅' : '⚠️';
        console.log(`  ${status} ${p.id.substring(0, 8)}... - role: ${p.role || 'null'}, segment: ${p.segment || 'null'}, tier: ${p.tier || 'null'}, type: ${p.type || 'null'}`);
      });
    }

    // Specific fixes for known test accounts
    console.log('\n🎯 Applying specific fixes for test accounts...\n');
    
    // Fix the free wholesaler account (d2a0b594-5bad-4280-9582-e5bfaedd388d)
    const { error: wholesalerFix } = await supabase
      .from('profiles')
      .update({
        segment: 'wholesaler',
        role: 'wholesaler',
        tier: 'free',
        type: 'wholesaler',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'd2a0b594-5bad-4280-9582-e5bfaedd388d');

    if (wholesalerFix) {
      console.error('  ❌ Error fixing free wholesaler:', wholesalerFix);
    } else {
      console.log('  ✅ Fixed free wholesaler account (d2a0b594-5bad-4280-9582-e5bfaedd388d)');
    }

    // Fix admin account (2157d77d-83b9-4214-b698-3b12ebf18792)
    const { error: adminFix } = await supabase
      .from('profiles')
      .update({
        segment: 'investor', // Valid value for constraint
        role: 'admin',       // This identifies them as admin
        tier: 'enterprise',
        type: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', '2157d77d-83b9-4214-b698-3b12ebf18792');

    if (adminFix) {
      console.error('  ❌ Error fixing admin account:', adminFix);
    } else {
      console.log('  ✅ Fixed admin account (2157d77d-83b9-4214-b698-3b12ebf18792)');
    }

    // Fix Russell Quealy admin account (bf2050bb-b192-4a32-9f62-f57abad82ea7)
    const { error: russellFix } = await supabase
      .from('profiles')
      .update({
        segment: 'investor', // Valid value for constraint
        role: 'admin',       // This identifies them as admin
        tier: 'enterprise',
        type: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'bf2050bb-b192-4a32-9f62-f57abad82ea7');

    if (russellFix) {
      console.error('  ❌ Error fixing Russell Quealy account:', russellFix);
    } else {
      console.log('  ✅ Fixed Russell Quealy admin account (bf2050bb-b192-4a32-9f62-f57abad82ea7)');
    }

    console.log('\n🎉 Profile fix script completed successfully!');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fixProfiles();
}

module.exports = { fixProfiles };

