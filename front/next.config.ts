import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  transpilePackages: ["lucide-react"],
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.syuan.email/api/:path*",
        // destination: "http://localhost:8081/api/:path*"
      }
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true" // 通过环境变量控制分析是否启用
})(nextConfig);
