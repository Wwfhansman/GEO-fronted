import React from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "../components/providers/LanguageProvider";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "../lib/i18n";

export const metadata = {
  title: "GiuGEO",
  description: "Measure and improve how your brand shows up across AI answers.",
  other: {
    "baidu-site-verification": "codeva-Ff1AAQrJ4v",
    "bytedance-verification-code": "8t7CWKyEgH0XyzKv12vY",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLanguage = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);

  return (
    <html lang={initialLanguage === "zh" ? "zh-CN" : "en"} className="dark">
      <body className="bg-surface text-on-surface font-body antialiased">
        <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
