import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * PKCE Cookie Decoder
 * 
 * The app stores the PKCE session in a cookie named 'dealflow-auth-token'
 * with format: "base64-<base64-encoded-json>"
 * 
 * The JSON contains: { access_token: string, refresh_token: string, ... }
 */

export async function getPkceAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('dealflow-auth-token')?.value;

  if (!raw) {
    console.log('[getPkceAccessTokenFromCookies] No dealflow-auth-token cookie found');
    return null;
  }

  // Cookie format is "base64-<base64 json>" or just the base64 part
  const base64Part = raw.startsWith('base64-') ? raw.slice('base64-'.length) : raw;

  try {
    // Decode base64 to string
    const jsonString = Buffer.from(base64Part, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonString) as {
      access_token?: string;
      refresh_token?: string;
      session?: { access_token?: string; refresh_token?: string };
      [key: string]: unknown;
    };

    // Extract access token from various possible structures
    const token =
      parsed.access_token ??
      parsed.session?.access_token ??
      null;

    if (typeof token === 'string' && token.length > 0) {
      console.log('[getPkceAccessTokenFromCookies] Successfully extracted access token', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      });
      return token;
    }

    console.log('[getPkceAccessTokenFromCookies] No access_token found in parsed JSON', {
      keys: Object.keys(parsed),
    });
    return null;
  } catch (error) {
    console.error('[getPkceAccessTokenFromCookies] Failed to decode dealflow-auth-token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      rawLength: raw.length,
      rawPreview: raw.substring(0, 50) + '...',
    });
    return null;
  }
}

/**
 * Admin Authentication Result
 */
export type RequireAdminResult =
  | {
      ok: true;
      user: User;
      profile: {
        id: string;
        email: string | null;
        role: string | null;
        segment: string | null;
        tier: string | null;
        membership_tier: string | null;
        [key: string]: unknown;
      };
      supabase: ReturnType<typeof createClient<Database>>;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

/**
 * Require Admin API (PKCE-aware)
 * 
 * Reads the PKCE access token from dealflow-auth-token cookie,
 * validates it with Supabase, and checks admin status.
 * 
 * This is the single source of truth for admin authentication in API routes.
 */
export async function requireAdminApi(): Promise<RequireAdminResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[requireAdminApi] Missing Supabase configuration');
    return {
      ok: false,
      status: 401,
      message: 'Server configuration error',
    };
  }

  // Step 1: Extract access token from PKCE cookie
  const accessToken = await getPkceAccessTokenFromCookies();

  if (!accessToken) {
    // Log cookies for debugging
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value && c.value.length > 0,
      length: c.value?.length ?? 0,
    }));

    console.log('[requireAdminApi] No PKCE access token found', {
      cookies: allCookies,
      hasDealflowCookie: !!cookieStore.get('dealflow-auth-token'),
    });

    return {
      ok: false,
      status: 401,
      message: 'Not authenticated (no PKCE access token cookie found)',
    };
  }

  // Step 2: Create Supabase client and validate token
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Step 3: Get user using the access token
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    console.error('[requireAdminApi] getUser error', {
      error: userError?.message,
      errorCode: userError?.status,
      hasUser: !!userData?.user,
    });

    return {
      ok: false,
      status: 401,
      message: 'Not authenticated (Supabase getUser returned no user)',
    };
  }

  const user = userData.user;

  console.log('[requireAdminApi] User authenticated', {
    userId: user.id,
    email: user.email,
  });

  // Step 4: Fetch profile to check admin status
  type ProfileRow = {
    id: string;
    email: string | null;
    role: string | null;
    segment: string | null;
    tier: string | null;
    membership_tier: string | null;
  };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,role,segment,tier,membership_tier')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (profileError || !profile) {
    console.error('[requireAdminApi] profile fetch error', {
      error: profileError?.message,
      userId: user.id,
    });

    return {
      ok: false,
      status: 403,
      message: 'Not authorized (no profile found)',
    };
  }

  // Step 5: Check admin status using same logic as client-side
  const role = profile.role ?? null;
  const segment = profile.segment ?? null;
  const email = profile.email ?? null;

  // Use the same admin check logic as client-side (matching lib/admin.ts isAdmin())
  const isAdmin =
    role === 'admin' ||
    segment === 'admin' ||
    (email && email.toLowerCase() === 'admin@offaxisdeals.com') ||
    profile.tier === 'enterprise' ||
    profile.membership_tier === 'enterprise';

  console.log('[requireAdminApi] Admin check result', {
    userId: user.id,
    email: user.email,
    role,
    segment,
    isAdmin,
  });

  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      message: 'Not authorized (user is not admin)',
    };
  }

  return {
    ok: true,
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      segment: profile.segment,
      tier: profile.tier,
      membership_tier: profile.membership_tier,
    },
    supabase,
  };
}

