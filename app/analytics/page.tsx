import { redirect } from 'next/navigation';

/**
 * Analytics Root Page
 * 
 * This page only redirects when users navigate to /analytics directly.
 * It does NOT redirect when users are already on child routes like /analytics/lead-conversion.
 * 
 * The redirect logic in app/login/page.tsx handles preventing redundant redirects
 * by checking if the current path already starts with /analytics/.
 * 
 * Admin users accessing analytics should use /admin/analytics/* routes instead,
 * which have their own admin-only auth checks and don't trigger this redirect.
 */
export default function AnalyticsPage() {
  redirect('/analytics/lead-conversion');
}

