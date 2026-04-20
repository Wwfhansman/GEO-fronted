"use client";

import React from "react";
import Link from "next/link";
import { trackEvent } from "../../lib/analytics";
import { useLanguage } from "../providers/LanguageProvider";

const navItems = {
  en: [
    { label: "Home", href: "/#top" },
    { label: "Industry", href: "/#industry-analysis" },
    { label: "Product", href: "/#product-capability" },
    { label: "Team", href: "/#team-advantage" },
    { label: "FAQ", href: "/#faq" },
    { label: "Test", href: "/test" },
  ],
  zh: [
    { label: "首页", href: "/#top" },
    { label: "行业解析", href: "/#industry-analysis" },
    { label: "产品能力", href: "/#product-capability" },
    { label: "团队优势", href: "/#team-advantage" },
    { label: "相关问题", href: "/#faq" },
    { label: "测试", href: "/test" },
  ],
} as const;

interface HeaderProps {
  isAuthenticated: boolean;
  currentEmail: string;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  activePath?: string;
}

export function Header({
  isAuthenticated,
  currentEmail,
  onLoginClick,
  onLogoutClick,
  activePath = "/",
}: HeaderProps) {
  const { language, setLanguage } = useLanguage();
  const currentNavItems = navItems[language];

  function isNavItemActive(href: string) {
    if (activePath === "/" && href.startsWith("/#")) {
      return true;
    }
    return href === activePath;
  }

  function handleLanguageSwitch(nextLanguage: "en" | "zh") {
    if (nextLanguage === language) {
      return;
    }
    setLanguage(nextLanguage);
    trackEvent("language_switch", {
      source: "header",
      language: nextLanguage,
    });
  }

  return (
    <>
      {isAuthenticated && (
        <div className="w-full bg-[#000000] py-2 px-8 flex justify-end items-center space-x-6 text-xs font-label tracking-tight border-b border-outline-variant/50">
          <div className="flex items-center gap-2 opacity-80">
            <span className="material-symbols-outlined text-[14px]">account_circle</span>
            <span>{currentEmail}</span>
          </div>
          <button
            onClick={onLogoutClick}
            className="flex items-center gap-1 text-primary hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span>{language === "zh" ? "退出登录" : "Sign out"}</span>
          </button>
        </div>
      )}
      <header className="bg-surface dark:bg-surface">
        <nav className="flex justify-between items-center gap-6 w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <Link href="/" className="text-2xl font-headline font-bold tracking-tighter text-primary">
            GiuGEO
          </Link>

          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {currentNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() =>
                  trackEvent("nav_click", {
                    source: "header",
                    label: item.label,
                    target: item.href,
                  })
                }
                className={`text-sm font-medium transition-colors hover:text-on-surface ${
                  isNavItemActive(item.href) ? "text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <div className="inline-flex items-center rounded-full border border-outline-variant/25 bg-surface-container-low p-1">
              <button
                type="button"
                onClick={() => handleLanguageSwitch("zh")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors ${
                  language === "zh" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
                aria-label="Switch to Simplified Chinese"
              >
                简中
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch("en")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors ${
                  language === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
                aria-label="Switch to English"
              >
                ENG
              </button>
            </div>
            {!isAuthenticated && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="text-on-surface hover:bg-surface-container-low transition-colors duration-300 px-4 py-2 rounded-lg"
              >
                {language === "zh" ? "登录" : "Log in"}
              </button>
            )}
            <Link
              href="/test"
              className="bg-primary-container text-on-surface shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-95 duration-150 ease-in-out px-6 py-2 rounded-lg font-bold border border-outline-variant"
            >
              {language === "zh" ? "免费检测我的品牌" : "Run My Free Audit"}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
