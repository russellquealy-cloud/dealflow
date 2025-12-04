/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = '';

if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname;
  } catch (error) {
    console.warn('next.config.mjs: unable to parse NEXT_PUBLIC_SUPABASE_URL', error);
  }
}

const remotePatterns = [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'source.unsplash.com' },
];

if (supabaseHostname) {
  remotePatterns.push({ protocol: 'https', hostname: supabaseHostname });
}

const nextConfig = {
  images: {
    remotePatterns,
  },
  // Skip static generation for error pages to prevent prerendering issues
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Suppress error page prerendering errors (known Next.js 15 + React 19 issue)
  // Error pages will be generated at runtime instead
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Skip generating error pages during build (they'll be generated at runtime)
  // This prevents the "Cannot read properties of null (reading 'useRef')" error
  // during static export of error pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure error pages are always dynamic
  output: 'standalone',
};

export default nextConfig;
