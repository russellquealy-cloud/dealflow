import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Returns environment configuration status without exposing secrets
 */
export async function GET() {
  const env = {
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL || !!process.env.NEXT_PUBLIC_APP_URL,
    stripe: {
      secret: !!process.env.STRIPE_SECRET_KEY,
      publishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    maps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    email: {
      smtpHost: !!process.env.EMAIL_SMTP_HOST,
      smtpUser: !!process.env.EMAIL_SMTP_USER,
      smtpPass: !!process.env.EMAIL_SMTP_PASS,
      from: !!process.env.EMAIL_FROM,
    },
  };

  const allConfigured = 
    env.siteUrl &&
    env.stripe.secret &&
    env.stripe.publishable &&
    env.stripe.webhook &&
    env.supabase.url &&
    env.supabase.anonKey &&
    env.maps &&
    env.email.smtpHost &&
    env.email.smtpUser &&
    env.email.smtpPass &&
    env.email.from;

  return NextResponse.json({
    ok: allConfigured,
    env,
    timestamp: new Date().toISOString(),
  });
}

