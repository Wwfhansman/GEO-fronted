import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface dark:bg-surface w-full border-t border-outline-variant/30 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-8 w-full max-w-screen-2xl mx-auto">
        <div className="font-headline font-black text-primary mb-4 md:mb-0">GiuGEO 智能团队</div>
        <div className="flex space-x-8 mb-4 md:mb-0">
          <Link href="/security" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">安全中心</Link>
          <Link href="/status" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">服务状态</Link>
          <Link href="/privacy" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">隐私政策</Link>
          <Link href="/terms" className="font-body text-xs tracking-widest uppercase text-on-surface/60 hover:text-primary transition-all">服务条款</Link>
        </div>
        <div className="font-body text-xs tracking-widest uppercase text-on-surface/60 opacity-80">
          © 2026 GiuGEO. 保留所有权利.
        </div>
      </div>
    </footer>
  );
}
