import React from "react";
import "./globals.css";

export const metadata = {
  title: "GEO - AI曝光检测",
  description: "检测您的品牌在AI大模型中的曝光情况",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-surface text-on-surface font-body antialiased">
        {children}
      </body>
    </html>
  );
}
