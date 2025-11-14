/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  compress: true,

  // Use standalone output for Vercel deployment
  // Note: This will still try to generate static pages at build time
  // We prevent this by setting dynamic = 'force-dynamic' in layout.tsx
  output: 'standalone',

  // Enhanced image optimization
  images: {
    domains: [
      'ui-avatars.com',
      'is1-ssl.mzstatic.com',
      'is2-ssl.mzstatic.com',
      'is3-ssl.mzstatic.com',
      'is4-ssl.mzstatic.com',
      'is5-ssl.mzstatic.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'play-lh.googleusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable React Server Components
    serverComponentsExternalPackages: ['@prisma/client'],
    // Enable Turbopack (faster builds)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Skip static optimization for pages that require database
  // This prevents build errors when database is not available during build
  generateBuildId: async () => {
    // Use a custom build ID based on the latest git commit or timestamp
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and legacy URLs
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/analyze/:path*',
        destination: '/app/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;