// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/listings",
        permanent: false, // set true if you want a 308
      },
    ];
  },
};

module.exports = nextConfig;
