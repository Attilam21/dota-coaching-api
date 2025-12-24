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
  async redirects() {
    return [
      {
        source: '/dashboard/ai-summary',
        destination: '/dashboard/coaching-insights',
        permanent: true,
      },
      {
        source: '/dashboard/coaching',
        destination: '/dashboard/coaching-insights',
        permanent: true,
      },
      // RIMOSSO: redirect di /dashboard/profiling
      // La pagina /dashboard/profiling esiste e deve essere accessibile
      // {
      //   source: '/dashboard/profiling',
      //   destination: '/dashboard/coaching-insights',
      //   permanent: true,
      // },
    ];
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
