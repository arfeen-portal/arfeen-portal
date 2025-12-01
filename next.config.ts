/** @type {import('next').NextConfig} */
const nextConfig = {
  // yahan apni baaqi settings add kar sakte ho
  // e.g. images, redirects, etc.

  experimental: {
    // IMPORTANT: yahan typedRoutes NA likho
    // agar pehle { typedRoutes: true } tha to hata do
  },

  // Next.js 16 me typedRoutes top level pe shift ho chuka hai.
  // Hum isko off rakh rahe hain taake "/dashboard" wali AppRoutes error khatam ho jaye.
  typedRoutes: false,
};

module.exports = nextConfig;
