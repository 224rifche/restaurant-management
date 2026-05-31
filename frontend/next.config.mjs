/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Si API_BASE_URL est défini (ex: dans Docker), on l'utilise.
        // Sinon, on tape sur le localhost par défaut.
        destination: process.env.API_BASE_URL 
          ? `${process.env.API_BASE_URL}/:path*` 
          : 'http://localhost:8000/api/:path*',
      },
    ]
  },
};

export default nextConfig;
