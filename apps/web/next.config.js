/** @type {import('next').NextConfig} */
const nextConfig = {
  // Port ayarları - sadece 3005 portunu kullan
  env: {
    PORT: '3005',
    HOSTNAME: 'localhost',
  },

  // PWA ve diğer ayarlar
  reactStrictMode: true,
  swcMinify: true,

  // API proxy ayarları
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3003/socket.io/:path*',
      },
    ];
  },

  // CORS ayarları
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;