import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { user, source } = await getUserFromRequest(req);

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        email: user.email,
        source,
        authHeaderPresent: true, // If we got here, auth worked
        error: null,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    // Handle 401 Response from getUserFromRequest
    if (e instanceof Response) {
      const errorData = await e.json();
      return NextResponse.json(
        {
          ok: false,
          userId: null,
          email: null,
          source: null,
          authHeaderPresent: !!req.headers.get('authorization'),
          error: {
            name: 'Unauthorized',
            message: errorData.error || 'Unable to determine authenticated user',
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        userId: null,
        email: null,
        source: null,
        authHeaderPresent: !!req.headers.get('authorization'),
        error: {
          name: 'UnexpectedError',
          message: e instanceof Error ? e.message : String(e),
        },
      },
      { status: 200 },
    );
  }
}
