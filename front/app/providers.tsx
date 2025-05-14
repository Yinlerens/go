'use client';

import { ReactQueryProvider } from '@/lib/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        cssVar: true,
        token: {
          colorPrimary: "#1772b4"
        }
      }}
    >
      <ReactQueryProvider>
        {children}
        <Toaster position="top-right" richColors expand={true} />
        <Analytics />
        <SpeedInsights />
      </ReactQueryProvider>
    </ConfigProvider>
  );
}
