/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  output: 'export',
  distDir: 'out', // Set output directory for static export
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  // ...add other Next.js config options here
};

module.exports = nextConfig;
