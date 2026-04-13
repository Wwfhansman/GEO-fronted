import React from "react";

export const metadata = {
  title: "GEO - AI曝光检测",
  description: "检测您的品牌在AI大模型中的曝光情况",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
