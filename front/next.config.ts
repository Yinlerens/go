import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["lucide-react"],
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    reactCompiler: true,
    optimizePackageImports: ["@ant-design/pro-components"]
  }
};

// 首先应用 Bundle Analyzer
const configWithBundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true" // 通过环境变量控制分析是否启用
})(nextConfig);

// 然后应用 Sentry 配置
export default withSentryConfig(configWithBundleAnalyzer, {
  org: "rain-og",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});
