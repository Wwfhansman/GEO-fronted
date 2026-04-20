"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../providers/LanguageProvider";

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="bg-surface dark:bg-surface w-full border-t border-outline-variant/30 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8 w-full max-w-screen-2xl mx-auto">
        <div className="font-headline font-black text-primary mb-4 md:mb-0">
          {language === "zh" ? "GiuGEO 智能团队" : "GiuGEO Intelligence Team"}
        </div>
        <div className="flex space-x-8 mb-4 md:mb-0">
          <Link href="/security" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">
            {language === "zh" ? "安全中心" : "Security"}
          </Link>
          <Link href="/status" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">
            {language === "zh" ? "服务状态" : "Status"}
          </Link>
          <Link href="/privacy" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">
            {language === "zh" ? "隐私政策" : "Privacy"}
          </Link>
          <Link href="/terms" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">
            {language === "zh" ? "服务条款" : "Terms"}
          </Link>
        </div>
        <div className="font-body text-xs tracking-widest uppercase text-on-surface/60 opacity-80">
          {language === "zh" ? "© 2026 GiuGEO. 保留所有权利." : "© 2026 GiuGEO. All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
