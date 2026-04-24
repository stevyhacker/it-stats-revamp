/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  // If you need to transpile packages from the monorepo
  // transpilePackages: ['ui'], // Example: if you had a shared 'ui' package

  // You might need specific configurations depending on your libraries (e.g., Recharts)
  // Example: Experimental features if needed by dependencies
  // experimental: {
  //   serverComponentsExternalPackages: ['@acme/ui'],
  // },
};

export default nextConfig;
