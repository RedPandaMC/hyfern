import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Compress HTML output
  compress: true,
  
  // Image optimization settings
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
