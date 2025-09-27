const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@turnuva/ui', '@turnuva/shared'],

  // PWA Configuration for Next.js 14
  // Note: appDir is default in Next.js 14, no need for experimental flag

  // PWA Headers for better caching and security
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // PWA Redirects
  redirects: async () => {
    return [
      {
        source: '/install',
        destination: '/?install=true',
        permanent: false,
      },
    ];
  },

  // PWA Rewrites for offline support
  rewrites: async () => {
    return [
      {
        source: '/offline',
        destination: '/offline.html',
      },
    ];
  },

  // Optimize for PWA performance
  compress: true,
  poweredByHeader: false,
  swcMinify: true,

  // Image optimization for PWA icons and assets
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration for PWA optimizations
  webpack: (config, { dev, isServer }) => {
    // PWA specific webpack optimizations
    if (!dev && !isServer) {
      // Optimize chunks for better PWA caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB chunks for better caching
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Environment variables for PWA
  env: {
    NEXT_PUBLIC_PWA_ENABLED: 'true',
    NEXT_PUBLIC_SW_URL: '/sw.js',
    NEXT_PUBLIC_MANIFEST_URL: '/manifest.json',
    NEXT_PUBLIC_APP_NAME: 'Turnuva Yönetim',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Generate unique build ID for cache busting
  generateBuildId: async () => {
    return `pwa-build-${Date.now()}`;
  },

  // Standalone output for better PWA deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Trailing slash configuration
  trailingSlash: false,
};

module.exports = withPWA(nextConfig);