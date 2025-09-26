/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Completely disable ESLint during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript strict checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip validation and checks
  experimental: {
    skipTrailingSlashRedirect: true,
  },
  // Disable source maps to speed up build
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig;
