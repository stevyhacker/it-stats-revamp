/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // If you need to transpile packages from the monorepo
  // transpilePackages: ['ui'], // Example: if you had a shared 'ui' package

  eslint: {
    // Warning: This disables linting during builds/exports (`next build`)!
    // You should lint manually or in CI/CD separately.
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Enable SWC minification for better performance
  swcMinify: true,

  // Optimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'numeral', 'lucide-react'],
  },

  // You might need specific configurations depending on your libraries (e.g., Recharts)
  // Example: Experimental features if needed by dependencies
  // experimental: {
  //   serverComponentsExternalPackages: ['@acme/ui'],
  // },
};

export default nextConfig;
