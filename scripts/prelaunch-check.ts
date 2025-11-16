/**
 * Pre-Launch Checklist Automation
 * 
 * Usage: pnpm tsx scripts/prelaunch-check.ts [baseUrl]
 * 
 * Runs automated checks to verify the application is ready for launch.
 * Checks environment variables, API routes, pages, and functionality.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envFiles = ['.env.local', '.env'];
envFiles.forEach((file) => {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    config({ path: filePath });
  }
});

interface CheckResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];
const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Helper functions
function addResult(name: string, status: 'success' | 'warning' | 'error', message: string, details?: string) {
  results.push({ name, status, message, details });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('PRE-LAUNCH CHECK RESULTS');
  console.log('='.repeat(80) + '\n');

  const success = results.filter(r => r.status === 'success');
  const warnings = results.filter(r => r.status === 'warning');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Success: ${success.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(r => {
      console.log(`  • ${r.name}: ${r.message}`);
      if (r.details) console.log(`    ${r.details}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(r => {
      console.log(`  • ${r.name}: ${r.message}`);
      if (r.details) console.log(`    ${r.details}`);
    });
    console.log('');
  }

  if (success.length > 0) {
    console.log('✅ SUCCESS:');
    success.forEach(r => {
      console.log(`  • ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(`Total Checks: ${results.length}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('='.repeat(80) + '\n');

  if (errors.length > 0) {
    process.exit(1);
  }
}

async function checkSupabaseKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    addResult('Supabase URL', 'error', 'NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }

  if (!anonKey) {
    addResult('Supabase Anon Key', 'error', 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return;
  }

  if (!serviceKey) {
    addResult('Supabase Service Key', 'warning', 'SUPABASE_SERVICE_ROLE_KEY is not set (some checks may fail)');
  } else {
    addResult('Supabase Service Key', 'success', 'SUPABASE_SERVICE_ROLE_KEY is set');
  }

  // Test connection
  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      addResult('Supabase Connection', 'error', `Failed to connect: ${error.message}`);
    } else {
      addResult('Supabase Connection', 'success', 'Successfully connected to Supabase');
    }
  } catch (error) {
    addResult('Supabase Connection', 'error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  addResult('Supabase URL', 'success', 'NEXT_PUBLIC_SUPABASE_URL is set');
  addResult('Supabase Anon Key', 'success', 'NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
}

async function checkRedirectUrls() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const expectedLogin = `${siteUrl}/login`;
  const expectedReset = `${siteUrl}/reset-password`;

  if (!siteUrl) {
    addResult('Redirect URLs', 'error', 'NEXT_PUBLIC_SITE_URL is not set');
    return;
  }

  // Check if URLs match production
  const isProduction = siteUrl.includes('offaxisdeals.com') || siteUrl.includes('vercel.app');
  
  if (isProduction) {
    addResult('Redirect URLs', 'success', `Production URLs configured: ${expectedLogin}, ${expectedReset}`);
  } else {
    addResult('Redirect URLs', 'warning', `Development URLs configured: ${expectedLogin}, ${expectedReset}`);
  }
}

async function checkWatchlistAPI() {
  try {
    const response = await fetch(`${baseUrl}/api/watchlists`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 401 (unauthorized) which means the endpoint exists
    if (response.status === 401 || response.status === 200) {
      addResult('Watchlist API', 'success', 'Watchlist API endpoint is accessible');
    } else {
      addResult('Watchlist API', 'error', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    addResult('Watchlist API', 'error', `Failed to reach endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkStripeWebhooks() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    addResult('Stripe Webhooks', 'warning', 'STRIPE_SECRET_KEY is not set');
    return;
  }

  if (!webhookSecret) {
    addResult('Stripe Webhooks', 'warning', 'STRIPE_WEBHOOK_SECRET is not set (webhooks may not work)');
  } else {
    addResult('Stripe Webhooks', 'success', 'STRIPE_WEBHOOK_SECRET is configured');
  }

  // Check webhook endpoint exists
  try {
    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    });

    // Should return 400 or 401 (not 404), meaning endpoint exists
    if (response.status === 404) {
      addResult('Stripe Webhook Endpoint', 'error', 'Webhook endpoint not found');
    } else {
      addResult('Stripe Webhook Endpoint', 'success', 'Webhook endpoint exists');
    }
  } catch (error) {
    addResult('Stripe Webhook Endpoint', 'error', `Failed to check endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  addResult('Stripe Secret Key', 'success', 'STRIPE_SECRET_KEY is set');
}

async function checkRLSPolicies() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    addResult('RLS Policies', 'warning', 'Cannot check RLS policies without Supabase credentials');
    return;
  }

  try {
    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    // Check if RLS is enabled on key tables
    const tables = ['profiles', 'listings', 'messages', 'watchlists', 'saved_searches'];
    let allEnabled = true;

    for (const table of tables) {
      try {
        // Try to query with service role (should work even with RLS)
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.message.includes('RLS')) {
          allEnabled = false;
          break;
        }
      } catch (err) {
        // Ignore individual table errors
      }
    }

    if (allEnabled) {
      addResult('RLS Policies', 'success', 'RLS appears to be configured on key tables');
    } else {
      addResult('RLS Policies', 'warning', 'Some tables may have RLS issues');
    }
  } catch (error) {
    addResult('RLS Policies', 'warning', `Could not verify RLS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkAdminAccount() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    addResult('Admin Account', 'warning', 'Cannot check admin account without Supabase service key');
    return;
  }

  try {
    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email, role, segment')
      .or('role.eq.admin,segment.eq.admin')
      .limit(5);

    if (error) {
      addResult('Admin Account', 'error', `Failed to query admin accounts: ${error.message}`);
      return;
    }

    if (!admins || admins.length === 0) {
      addResult('Admin Account', 'error', 'No admin accounts found');
    } else {
      const adminEmails = admins.map(a => a.email || 'N/A').join(', ');
      addResult('Admin Account', 'success', `Found ${admins.length} admin account(s): ${adminEmails}`);
    }
  } catch (error) {
    addResult('Admin Account', 'error', `Error checking admin accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkMobileViewport() {
  // Check if viewport meta tag exists in HTML
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();
    
    const hasViewport = html.includes('viewport') || html.includes('device-width');
    if (hasViewport) {
      addResult('Mobile Viewport', 'success', 'Viewport meta tag is present');
    } else {
      addResult('Mobile Viewport', 'warning', 'Viewport meta tag not found in HTML');
    }
  } catch (error) {
    addResult('Mobile Viewport', 'error', `Failed to check viewport: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkErrorPages() {
  // Check for a non-existent page to trigger 404
  try {
    const response = await fetch(`${baseUrl}/this-page-definitely-does-not-exist-${Date.now()}`);
    // Next.js should return 404 for non-existent pages
    if (response.status === 404) {
      addResult('Error Page 404', 'success', '404 error handling works');
    } else {
      addResult('Error Page 404', 'warning', `Unexpected status for 404: ${response.status}`);
    }
  } catch (error) {
    addResult('Error Page 404', 'error', `Failed to check 404: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Note: 500 page is harder to test without causing an actual error
  addResult('Error Page 500', 'warning', '500 error page cannot be automatically tested');
}

async function checkSitemapRobots() {
  // Check robots.txt
  try {
    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    if (robotsResponse.ok) {
      const robotsText = await robotsResponse.text();
      if (robotsText.includes('sitemap')) {
        addResult('Robots.txt', 'success', 'robots.txt exists and references sitemap');
      } else {
        addResult('Robots.txt', 'success', 'robots.txt exists');
      }
    } else {
      addResult('Robots.txt', 'warning', `robots.txt returned status ${robotsResponse.status}`);
    }
  } catch (error) {
    addResult('Robots.txt', 'error', `Failed to fetch robots.txt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check sitemap.xml
  try {
    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    if (sitemapResponse.ok) {
      addResult('Sitemap.xml', 'success', 'sitemap.xml exists and is accessible');
    } else if (sitemapResponse.status === 404) {
      addResult('Sitemap.xml', 'warning', 'sitemap.xml not found (may be generated dynamically)');
    } else {
      addResult('Sitemap.xml', 'warning', `sitemap.xml returned status ${sitemapResponse.status}`);
    }
  } catch (error) {
    addResult('Sitemap.xml', 'warning', `Could not check sitemap.xml: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkTermsPrivacy() {
  const pages = [
    { path: '/terms', name: 'Terms' },
    { path: '/privacy', name: 'Privacy' },
    { path: '/refund-policy', name: 'Refund Policy' },
  ];

  for (const page of pages) {
    try {
      const response = await fetch(`${baseUrl}${page.path}`);
      if (response.ok) {
        addResult(`${page.name} Page`, 'success', `${page.name} page is accessible`);
      } else {
        addResult(`${page.name} Page`, 'error', `${page.name} page returned status ${response.status}`);
      }
    } catch (error) {
      addResult(`${page.name} Page`, 'error', `Failed to check ${page.name} page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

async function checkMapLoads() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    addResult('Google Maps API', 'error', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
    return;
  }

  // Check if listings page loads (which includes map)
  try {
    const response = await fetch(`${baseUrl}/listings`);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('google') || html.includes('maps')) {
        addResult('Map Integration', 'success', 'Map appears to be integrated on listings page');
      } else {
        addResult('Map Integration', 'warning', 'Map may not be loading on listings page');
      }
    } else {
      addResult('Map Integration', 'error', `Listings page returned status ${response.status}`);
    }
  } catch (error) {
    addResult('Map Integration', 'error', `Failed to check map: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  addResult('Google Maps API Key', 'success', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set');
}

async function checkMessaging() {
  try {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 401 (unauthorized) which means the endpoint exists
    if (response.status === 401 || response.status === 200) {
      addResult('Messaging API', 'success', 'Messaging API endpoint is accessible');
    } else if (response.status === 404) {
      addResult('Messaging API', 'error', 'Messaging API endpoint not found');
    } else {
      addResult('Messaging API', 'warning', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    addResult('Messaging API', 'error', `Failed to reach endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check messages page
  try {
    const response = await fetch(`${baseUrl}/messages`);
    if (response.ok) {
      addResult('Messages Page', 'success', 'Messages page is accessible');
    } else {
      addResult('Messages Page', 'warning', `Messages page returned status ${response.status}`);
    }
  } catch (error) {
    addResult('Messages Page', 'error', `Failed to check messages page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkNotifications() {
  try {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 401 (unauthorized) which means the endpoint exists
    if (response.status === 401 || response.status === 200) {
      addResult('Notifications API', 'success', 'Notifications API endpoint is accessible');
    } else if (response.status === 404) {
      addResult('Notifications API', 'error', 'Notifications API endpoint not found');
    } else {
      addResult('Notifications API', 'warning', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    addResult('Notifications API', 'error', `Failed to reach endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check notifications page
  try {
    const response = await fetch(`${baseUrl}/notifications`);
    if (response.ok) {
      addResult('Notifications Page', 'success', 'Notifications page is accessible');
    } else if (response.status === 404) {
      addResult('Notifications Page', 'warning', 'Notifications page not found (may be at /settings/notifications)');
    } else {
      addResult('Notifications Page', 'warning', `Notifications page returned status ${response.status}`);
    }
  } catch (error) {
    addResult('Notifications Page', 'error', `Failed to check notifications page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkImageUploads() {
  // Check if there's an image upload endpoint
  const uploadEndpoints = ['/api/upload', '/api/images/upload', '/api/listings/upload'];
  let found = false;

  for (const endpoint of uploadEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Any response (except 404) means endpoint exists
      if (response.status !== 404) {
        found = true;
        addResult('Image Upload', 'success', `Image upload endpoint found at ${endpoint}`);
        break;
      }
    } catch (error) {
      // Ignore errors for this check
    }
  }

  if (!found) {
    addResult('Image Upload', 'warning', 'Image upload endpoint not found (may use external service)');
  }
}

async function checkAPIRoutes() {
  const apiRoutes = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/listings', method: 'GET' },
    { path: '/api/watchlists', method: 'GET' },
    { path: '/api/messages', method: 'GET' },
    { path: '/api/notifications', method: 'GET' },
    { path: '/api/saved-searches', method: 'GET' },
    { path: '/api/analytics', method: 'GET' },
    { path: '/api/ai-usage', method: 'GET' },
    { path: '/api/admin/users', method: 'GET' },
    { path: '/api/admin/flags', method: 'GET' },
    { path: '/api/billing/webhook', method: 'POST' },
    { path: '/api/cron/cleanup-ai-usage', method: 'GET' },
    { path: '/api/diagnostics/email', method: 'POST' },
    { path: '/api/feedback', method: 'POST' },
    { path: '/api/geocode', method: 'GET' },
  ];

  const routeResults: Array<{ route: string; status: number; ok: boolean }> = [];

  for (const route of apiRoutes) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 200, 401, 403, 400 are all acceptable (endpoint exists)
      // 404 means endpoint doesn't exist
      const isOk = response.status !== 404;
      routeResults.push({ route: route.path, status: response.status, ok: isOk });

      if (!isOk) {
        addResult(`API Route ${route.path}`, 'error', `Endpoint returned 404`);
      } else if (response.status >= 500) {
        addResult(`API Route ${route.path}`, 'warning', `Endpoint returned ${response.status}`);
      } else {
        addResult(`API Route ${route.path}`, 'success', `Endpoint accessible (${response.status})`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        addResult(`API Route ${route.path}`, 'error', 'Request timed out');
      } else {
        addResult(`API Route ${route.path}`, 'error', `Failed to reach: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      routeResults.push({ route: route.path, status: 0, ok: false });
    }
  }

  const successCount = routeResults.filter(r => r.ok).length;
  const totalCount = routeResults.length;
  
  if (successCount === totalCount) {
    addResult('All API Routes', 'success', `All ${totalCount} API routes are accessible`);
  } else {
    addResult('All API Routes', 'warning', `${successCount}/${totalCount} API routes are accessible`);
  }
}

// Main execution
async function runChecks() {
  console.log('Running pre-launch checks...\n');
  console.log(`Base URL: ${baseUrl}\n`);

  await checkSupabaseKeys();
  await checkRedirectUrls();
  await checkWatchlistAPI();
  await checkStripeWebhooks();
  await checkRLSPolicies();
  await checkAdminAccount();
  await checkMobileViewport();
  await checkErrorPages();
  await checkSitemapRobots();
  await checkTermsPrivacy();
  await checkMapLoads();
  await checkMessaging();
  await checkNotifications();
  await checkImageUploads();
  await checkAPIRoutes();

  printResults();
}

runChecks().catch((error) => {
  console.error('Fatal error running checks:', error);
  process.exit(1);
});

