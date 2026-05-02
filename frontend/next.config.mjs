/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Em produção (Vercel), NEXT_PUBLIC_API_URL aponta pro backend no Render.
    // Em desenvolvimento local, cai no 127.0.0.1:8000
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
