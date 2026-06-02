/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/billing',
        destination: '/admin/billing',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
