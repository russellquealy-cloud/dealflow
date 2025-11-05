// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Add paywall headers for protected routes
  if (pathname.startsWith('/analyzer') || 
      pathname.startsWith('/watchlists') || 
      pathname.startsWith('/alerts') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/settings/integrations/crm') ||
      pathname.startsWith('/data-feed') ||
      pathname.startsWith('/orgs') ||
      pathname.startsWith('/integrations')) {
    
    const response = NextResponse.next();
    response.headers.set('x-paywall-required', 'true');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - all API routes are allowed, including email-diag and test-email)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
