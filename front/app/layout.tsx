import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryProvider } from "./providers";

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
      <body className="h-full">
        <AntdRegistry>
          <QueryProvider>{children}</QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
