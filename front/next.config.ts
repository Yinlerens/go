import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['lucide-react'], // add this,
  eslint: {
    ignoreDuringBuilds: true
  },
  output: 'standalone'
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true' // 通过环境变量控制分析是否启用
})(nextConfig);
