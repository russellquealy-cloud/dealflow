import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/server';

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

export async function GET(req: NextRequest) {
  try {
    // Use the unified auth helper (tries cookies first, falls back to Bearer token)
    const { user, supabase } = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
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
      query = query.is('read_at', null);
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
    // Handle 401 Response from getUserFromRequest
    if (error instanceof Response) {
      return error;
    }
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

export async function PATCH(req: NextRequest) {
  try {
    // Use the unified auth helper (tries cookies first, falls back to Bearer token)
    const { user, supabase } = await getUserFromRequest(req);

    const body = await req.json().catch(() => null);
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
    // Handle 401 Response from getUserFromRequest
    if (error instanceof Response) {
      return error;
    }
    console.error('Error updating notifications', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}


