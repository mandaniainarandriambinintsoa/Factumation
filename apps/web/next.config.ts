import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
};

export default nextConfig;
