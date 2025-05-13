import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
export const metadata: Metadata = {
  title: "Yinleren1",
  description: "Yinleren"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full">
      <body className={" h-full"}>
        <Toaster richColors position="top-center" expand={true} />
        <AntdRegistry>{children}</AntdRegistry>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
