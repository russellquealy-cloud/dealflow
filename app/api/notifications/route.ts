import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';

export const runtime = 'nodejs';

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
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
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
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!isPatchPayload(body) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: body.is_read })
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


