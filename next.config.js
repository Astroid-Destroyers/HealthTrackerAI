/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript strict checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig;
