/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⛔ STOP static generation completely
  output: 'standalone',
};

module.exports = nextConfig;
