/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  compress: true,

  // Fix for server-side global references
  output: 'standalone',

  // Environment variables
  env: {
    CUSTOM_SELF: 'global',
  },

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

  // Bundle optimization and fix for 'self is not defined' error
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix 'self is not defined' error for server-side
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': '({})',
          'window': 'undefined',
          'document': 'undefined',
          'navigator': 'undefined',
        })
      );
    }

    // Additional plugin to inject self into global scope
    config.plugins.push(
      new webpack.BannerPlugin({
        banner: 'if (typeof global !== "undefined") { global.self = global; } else if (typeof window !== "undefined") { global.self = window; }',
        raw: true,
        entryOnly: true,
        include: /\.js$/,
      })
    );
    // Optimize bundle size
    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: -10,
            enforce: true,
          },
        },
      };
    }

    // Reduce bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Optimize for production
    if (!dev && !isServer && config.optimization) {
      config.optimization.minimize = true;
    }

    return config;
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

