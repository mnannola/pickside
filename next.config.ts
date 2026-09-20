import type { NextConfig } from 'next';
const config: NextConfig = { experimental: { cpus: 2 }, serverExternalPackages: ['@electric-sql/pglite', 'postgres'], poweredByHeader: false };
export default config;
