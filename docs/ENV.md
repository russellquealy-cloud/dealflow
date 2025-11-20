# Environment Variables Documentation

This document lists all required and optional environment variables for Off Axis Deals.

## Required Environment Variables

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://offaxisdeals.com
```

**Important:** Do NOT use `http://localhost:3000` in production. Always use the production domain.

### Google Maps API
```bash
# Server-side key (preferred for geocoding)
GOOGLE_GEOCODE_API_KEY=your-server-side-api-key

# Client-side key (fallback, also used for map display)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-side-api-key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id
```

**Google Maps API Requirements:**
- Enable the following APIs in Google Cloud Console:
  - Geocoding API
  - Places API
  - Places Details API
- Restrict the server-side key (`GOOGLE_GEOCODE_API_KEY`) to:
  - API restrictions: Geocoding API, Places API, Places Details API
  - HTTP referrer restrictions: Your production domain

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Email Configuration (Optional - if using custom SMTP)
```bash
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASSWORD=your-smtp-password
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
SUPPORT_EMAIL=support@offaxisdeals.com
```

## Optional Environment Variables

### Cron Jobs
```bash
CRON_SECRET=your-secret-for-cron-authentication
```

### Cookie Domain (Auto-detected if not set)
```bash
NEXT_PUBLIC_COOKIE_DOMAIN=.offaxisdeals.com
```

## Vercel Environment Variables Setup

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables listed above
3. Ensure `NEXT_PUBLIC_SITE_URL` is set to `https://offaxisdeals.com` (not localhost)
4. Ensure `GOOGLE_GEOCODE_API_KEY` is set with your server-side API key
5. Redeploy after adding new variables

## Local Development

For local development, create a `.env.local` file:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# ... other variables
```

**Note:** Some features (like magic link authentication) require the production URL in Supabase Auth settings, even for local testing.

---

**Last Updated:** November 19, 2025

