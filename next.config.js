/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Fix: Edge Runtime (Middleware) verbietet eval() – devtool deaktivieren
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.devtool = false
    }
    return config
  },
}
module.exports = nextConfig
