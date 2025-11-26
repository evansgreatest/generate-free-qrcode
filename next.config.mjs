/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack File System Caching (Next.js 16) - Faster dev builds
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  // React Compiler (Next.js 16) - Automatic memoization
  reactCompiler: true,

  // Cache Components (Next.js 16) - Better caching control and PPR
  // Temporarily disabled due to build issues with dynamic routes
  // Can be re-enabled once routes are properly configured
  // cacheComponents: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Next.js 16 defaults (already applied, but explicit for clarity)
    minimumCacheTTL: 14400, // 4 hours (Next.js 16 default)
    qualities: [75], // Next.js 16 default
    maximumRedirects: 3, // Next.js 16 default
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
