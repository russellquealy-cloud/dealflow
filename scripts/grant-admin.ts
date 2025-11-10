/**
 * Usage: pnpm tsx scripts/grant-admin.ts [email]
 *
 * Grants admin privileges to the user with the provided email address by
 * updating the `profiles` table (role -> 'admin'). Requires the Supabase
 * service role key to be configured in the environment.
 */

import { getSupabaseServiceRole } from '../app/lib/supabase/service';

async function grantAdmin(emailArg?: string) {
  const email = (emailArg || process.env.ADMIN_EMAIL || 'admin@offaxisdeals.com').trim().toLowerCase();

  if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
  }

  console.log(`Granting admin privileges to ${email}...`);

  try {
    const supabase = await getSupabaseServiceRole();

    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      email,
    });

    if (listError) {
      console.error('Failed to fetch user list:', listError);
      process.exit(1);
    }

    const user = userList?.users?.[0];

    if (!user) {
      console.error(`No Supabase user found with email ${email}`);
      process.exit(1);
    }

    const userId = user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, segment')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load profile record:', profileError);
      process.exit(1);
    }

    if (profile?.role === 'admin') {
      console.log(`User ${email} is already an admin. No update required.`);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile role:', updateError);
      process.exit(1);
    }

    console.log(`Role updated to 'admin' for user ${email}.`);
  } catch (error) {
    console.error('Unexpected error while granting admin role:', error);
    process.exit(1);
  }
}

grantAdmin(process.argv[2]);


