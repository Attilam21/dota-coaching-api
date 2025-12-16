/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.cloudflare.steamstatic.com', 'avatars.steamstatic.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
