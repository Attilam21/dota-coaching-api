/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        pathname: '/apps/dota2/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dota2.com',
        pathname: '/apps/dota2/images/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
