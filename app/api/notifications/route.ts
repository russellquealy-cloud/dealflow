import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '../../lib/supabaseRoute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseBoolean(value: string | null): boolean | null {
  if (value === null) return null;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Use PKCE-aware auth helper with bearer token fallback (same pattern as messages route)
    const supabase = await getSupabaseRouteClient();
    
    // Try getUser first (standard approach)
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If getUser fails, try Authorization header bearer token (same pattern as billing/messages routes)
    if ((userError || !user)) {
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (bearerToken) {
        console.log('[notifications] Cookie auth failed, trying bearer token');
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(bearerToken);
        if (tokenUser && !tokenError) {
          user = tokenUser;
          userError = null;
          console.log('[notifications] Bearer token auth succeeded', { userId: user.id });
        }
      }
    }
    
    // Fallback to getSession if getUser fails
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
      }
    }

    if (userError || !user) {
      console.log('[notifications] Auth failed', {
        hasUser: !!user,
        error: userError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = parseBoolean(searchParams.get('unreadOnly')) ?? false;

    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsed = Number.parseInt(limitParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, MAX_LIMIT);
      }
    }

    let offset = 0;
    if (offsetParam) {
      const parsed = Number.parseInt(offsetParam, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        offset = parsed;
      }
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load notifications', error);
      return NextResponse.json(
        { error: 'Failed to load notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error loading notifications', error);
    return NextResponse.json(
      { error: 'Failed to load notifications' },
      { status: 500 }
    );
  }
}

type PatchPayload = {
  ids: string[];
  is_read: boolean;
};

function isPatchPayload(input: unknown): input is PatchPayload {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const record = input as Record<string, unknown>;
  const ids = record.ids;
  const isRead = record.is_read;

  if (!Array.isArray(ids) || typeof isRead !== 'boolean') {
    return false;
  }

  return ids.every((id) => typeof id === 'string' && id.length > 0);
}

export async function PATCH(request: NextRequest) {
  try {
    // Use PKCE-aware auth helper with bearer token fallback
    const supabase = await getSupabaseRouteClient();
    
    // Try getUser first
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Fallback to bearer token if available
    if ((userError || !user)) {
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (bearerToken) {
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(bearerToken);
        if (tokenUser && !tokenError) {
          user = tokenUser;
          userError = null;
        }
      }
    }
    
    // Fallback to getSession
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
      }
    }

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!isPatchPayload(body) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: body.is_read } as never)
      .eq('user_id', user.id)
      .in('id', body.ids);

    if (error) {
      console.error('Failed to update notifications', error);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}


