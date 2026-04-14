"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { getAccessToken, getCurrentUserEmail, signOut } from "../../lib/auth";

interface DashboardSummary {
  user_count: number;
  test_count: number;
  lead_count: number;
  mentioned_count: number;
  funnel: {
    registered: number;
    tested: number;
    contacted: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("请先登录管理员账号");
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      const email = await getCurrentUserEmail();
      setCurrentEmail(email || "");

      const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("无权限访问，仅管理员可查看");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(`请求失败 (${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  async function handleSignOut() {
    await signOut();
    setIsAuthenticated(false);
    setCurrentEmail("");
    setSummary(null);
    setError("请先登录管理员账号");
  }

  const mentionRate = summary?.test_count 
    ? ((summary.mentioned_count / summary.test_count) * 100).toFixed(1) 
    : "0.0";

  const regToTestRate = summary?.user_count 
    ? ((summary.funnel.tested / summary.user_count) * 100).toFixed(1)
    : "0.0";

  const testToLeadRate = summary?.funnel.tested 
    ? ((summary.funnel.contacted / summary.funnel.tested) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        currentEmail={currentEmail}
        onLogoutClick={handleSignOut}
        activePath="/dashboard"
      />

      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex-grow w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-2">全站概览大盘</h1>
            <p className="text-on-surface-variant font-body max-w-2xl">
              监控实时流转数据，追踪平台注册用户对模型的测试覆盖率与线索转化漏斗。
            </p>
          </div>
          {summary && (
            <button 
              onClick={fetchSummary}
              className="text-xs font-bold text-primary flex items-center gap-2 border border-outline-variant/30 px-3 py-2 rounded shadow-sm hover:bg-surface-container-high transition-colors uppercase tracking-widest"
            >
              刷新数据
              <span className="material-symbols-outlined text-[14px]">refresh</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-on-surface opacity-60">加载中...</div>
        ) : error ? (
          <div className="text-center h-64 flex flex-col justify-center items-center border border-outline-variant/20 border-dashed rounded-xl">
            <span className="material-symbols-outlined text-4xl text-red-500/50 mb-4">lock</span>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={fetchSummary}
              className="px-6 py-2 bg-surface-container-high rounded text-sm hover:bg-surface-container-highest transition-colors"
            >
              重新验证
            </button>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-outline-variant/50 transition-all hover:bg-surface-container-high group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">总注册用户</div>
                <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[20px]">people</span>
              </div>
              <div className="text-4xl font-headline font-extrabold text-on-surface">{summary.user_count}</div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-outline-variant/50 transition-all hover:bg-surface-container-high group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">总检测请求</div>
                <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[20px]">troubleshoot</span>
              </div>
              <div className="text-4xl font-headline font-extrabold text-on-surface">{summary.test_count}</div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-primary/50 transition-all hover:bg-surface-container-high group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">有效提及次数</div>
                <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[20px]">verified_user</span>
              </div>
              <div className="text-4xl font-headline font-extrabold text-primary">{summary.mentioned_count}</div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-green-500/50 transition-all hover:bg-surface-container-high group relative overflow-hidden">
              <div className="absolute right-0 bottom-0 bg-green-500/10 w-24 h-24 rounded-tl-full -mr-4 -mb-4"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">销售线索</div>
                <span className="material-symbols-outlined text-green-500/40 group-hover:text-green-400 transition-colors text-[20px]">assignment_turned_in</span>
              </div>
              <div className="text-4xl font-headline font-extrabold text-on-surface relative z-10">{summary.lead_count}</div>
            </div>

            {/* Funnel Section */}
            <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-outline-variant/20 mt-4 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">filter_alt</span>
                获客漏斗
              </h2>
              
              <div className="space-y-6 relative z-10 my-8">
                {/* Registered users */}
                <div>
                  <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>注册</span>
                    <span className="text-on-surface">{summary.funnel.registered}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-outline-variant h-2 rounded-full" style={{ width: summary.funnel.registered > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                {/* Tested users */}
                <div>
                  <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>已检测</span>
                    <span className="text-on-surface">{summary.funnel.tested} <span className="opacity-40">({regToTestRate}%)</span></span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-primary/80 h-2 rounded-full transition-all duration-1000" style={{ width: summary.funnel.registered > 0 ? `${(summary.funnel.tested / summary.funnel.registered) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                {/* Contacted Leads */}
                <div>
                  <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>产生意向 / 已联系销售</span>
                    <span className="text-primary">{summary.funnel.contacted} <span className="opacity-40">({testToLeadRate}%)</span></span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-1000 delay-300" style={{ width: summary.funnel.registered > 0 ? `${(summary.funnel.contacted / summary.funnel.registered) * 100}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 mt-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary border-b border-outline-variant/20 pb-4">
                <span className="material-symbols-outlined">insights</span>
                核心流转率
              </h2>

              <div className="grid grid-cols-2 gap-y-8 gap-x-4 mt-8">
                <div>
                  <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">品牌被提及率</div >
                  <div className="text-3xl font-bold">{mentionRate}<span className="text-sm opacity-50">%</span></div>
                  <div className="text-[10px] mt-1 text-on-surface-variant opacity-60">
                    提及次数占所有检测的比例
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">注册 &rarr; 测试</div>
                  <div className="text-3xl font-bold">{regToTestRate}<span className="text-sm opacity-50">%</span></div>
                  <div className="text-[10px] mt-1 text-on-surface-variant opacity-60">
                    注册用户中完成测试比例
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">测试 &rarr; 线索</div>
                  <div className="text-3xl font-bold text-primary">{testToLeadRate}<span className="text-sm opacity-50">%</span></div>
                  <div className="text-[10px] mt-1 text-on-surface-variant opacity-60">
                    用户获取结果后申请后续咨询
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
