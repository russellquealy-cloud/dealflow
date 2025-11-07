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
};

export default nextConfig;
