/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/documents/:path*',
        destination: 'http://localhost:8001/api/v1/documents/:path*', // Proxy to your FastAPI backend
      },
      // Proxy for the forecasting and variance analysis service
      {
        source: '/api/variance-reports/:path*',
        destination: 'http://localhost:8004/variance-reports/:path*',
      },
      {
        source: '/api/forecast/:path*',
        destination: 'http://localhost:8004/forecast/:path*',
      },
      {
        source: '/auth/token',
        destination: '/api/auth/token',
      },
    ];
  },
}

export default nextConfig
