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
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Performance optimizations
  swcMinify: true,
}

export default nextConfig
