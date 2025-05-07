import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import Polling from "./polling";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
        <Polling />
        {children}
        <Analytics />
        <SpeedInsights/>
      </body>
      <Script src="https://unpkg.com/@antv/g2/dist/g2.min.js" />
    </html>
  );
}
