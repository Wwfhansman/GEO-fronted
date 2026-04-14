"use client";

import React from "react";
import Link from "next/link";

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
            <span>退出登录</span>
          </button>
        </div>
      )}
      <header className="bg-surface dark:bg-surface">
        <nav className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <Link href="/" className="text-2xl font-headline font-bold tracking-tighter text-primary">
            GiuGEO
          </Link>

          <div className="flex items-center space-x-4">
            {!isAuthenticated && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="text-on-surface hover:bg-surface-container-low transition-colors duration-300 px-4 py-2 rounded-lg"
              >
                登录
              </button>
            )}
            <Link
              href="/test"
              className="bg-primary-container text-on-surface shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-95 duration-150 ease-in-out px-6 py-2 rounded-lg font-bold border border-outline-variant"
            >
              免费检测我的品牌
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
