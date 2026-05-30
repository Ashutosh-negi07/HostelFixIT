/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow LAN devices (phone, tablet) to load Next.js JS bundles in dev mode
  allowedDevOrigins: ['192.168.1.2'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Proxy all /api/* requests to the Spring Boot backend.
  // This lets any device (phone, tablet, desktop) talk to the backend
  // through Next.js — no hardcoded IPs needed in the browser bundle.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
