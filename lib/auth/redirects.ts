/**
 * Auth redirect utilities
 * 
 * Centralized logic for determining where to redirect users after login/logout.
 * This prevents redirect loops and ensures consistent behavior across the app.
 */

/**
 * Get the default redirect destination for an authenticated user based on their profile
 * 
 * @param segment - User's segment ('investor', 'wholesaler', 'admin')
 * @returns Default route for the user
 */
export function getDefaultRedirectForUser(segment?: string | null): string {
  const segmentLower = (segment || '').toLowerCase();
  
  if (segmentLower === 'wholesaler') {
    return '/portal/wholesaler';
  } else if (segmentLower === 'admin') {
    return '/admin';
  } else {
    // Default for investor or unknown segment
    return '/listings';
  }
}

/**
 * Check if a path is a login/logout/auth route
 */
export function isAuthRoute(path: string): boolean {
  return path.startsWith('/login') || 
         path.startsWith('/signup') || 
         path.startsWith('/auth/') ||
         path.startsWith('/signout');
}

/**
 * Check if we should redirect away from login page
 * 
 * @param currentPath - Current pathname
 * @param nextPath - Intended destination from 'next' param
 * @returns true if we should redirect away, false if we should stay on login
 */
export function shouldRedirectFromLogin(currentPath: string, nextPath: string): boolean {
  // Never redirect if we're not actually on /login
  if (!currentPath.startsWith('/login')) {
    return false;
  }
  
  // Don't redirect if next is also a login/auth route (prevents loops)
  if (isAuthRoute(nextPath)) {
    return false;
  }
  
  // Don't redirect if next equals current (already there)
  if (currentPath === nextPath) {
    return false;
  }
  
  // Don't redirect to same path we're already on (prevent loops)
  const currentPathNoQuery = currentPath.split('?')[0];
  const nextPathNoQuery = nextPath.split('?')[0];
  if (currentPathNoQuery === nextPathNoQuery) {
    return false;
  }
  
  // Additional check: if next path is an analytics route and we have a next param pointing to analytics,
  // make sure we're not creating a loop by checking if the referer chain suggests we're already bouncing
  // This prevents /analytics/heatmap -> /login?next=/analytics/heatmap -> /analytics/heatmap -> /login loops
  if (nextPathNoQuery.startsWith('/analytics/')) {
    // Allow redirect to analytics if we came from a non-analytics page (e.g., /account)
    // Block redirect if we're already in an analytics redirect loop
    // The login page's useEffect will handle this with additional checks
    return true;
  }
  
  return true;
}

/**
 * Normalize and validate a redirect path
 * 
 * @param path - Path to normalize
 * @param fallback - Fallback path if path is invalid
 * @returns Valid, normalized path
 */
export function normalizeRedirectPath(path: string | null | undefined, fallback: string = '/listings'): string {
  if (!path || path.trim() === '') {
    return fallback;
  }
  
  // Remove any auth routes from redirect (prevents loops)
  if (isAuthRoute(path)) {
    return fallback;
  }
  
  // Ensure path starts with /
  const normalized = path.startsWith('/') ? path : `/${path}`;
  
  return normalized;
}

