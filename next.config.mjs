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
    ];
  },
}

export default nextConfig
