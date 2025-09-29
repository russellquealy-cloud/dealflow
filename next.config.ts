// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don’t fail the production build if ESLint errors are present.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
