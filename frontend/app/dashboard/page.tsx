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
  traffic_summary: {
    landing_views: number;
    test_page_views: number;
    result_page_views: number;
    landing_to_test_rate: number;
    landing_cta_rate: number;
    test_completion_rate: number;
    lead_submission_rate: number;
  };
  traffic_funnel: Array<{
    event_name: string;
    label: string;
    count: number;
    conversion_from_previous: number | null;
    conversion_from_start: number | null;
  }>;
  traffic_diagnosis: {
    largest_dropoff: {
      from: string;
      to: string;
      dropoff: number;
    } | null;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function formatPercent(value: number | null): string {
  return value === null ? "--" : `${value}%`;
}

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

  function exportSummaryCsv() {
    if (!summary) {
      return;
    }

    const rows: string[][] = [
      ["Category", "Metric", "Value"],
      ["Business", "Registered Users", String(summary.user_count)],
      ["Business", "Completed Tests", String(summary.test_count)],
      ["Business", "Leads", String(summary.lead_count)],
      ["Business", "Mentioned Count", String(summary.mentioned_count)],
      ["Business Funnel", "Registered", String(summary.funnel.registered)],
      ["Business Funnel", "Tested", String(summary.funnel.tested)],
      ["Business Funnel", "Contacted", String(summary.funnel.contacted)],
      ["Traffic", "Landing Views", String(summary.traffic_summary.landing_views)],
      ["Traffic", "Test Page Views", String(summary.traffic_summary.test_page_views)],
      ["Traffic", "Result Page Views", String(summary.traffic_summary.result_page_views)],
      ["Traffic", "Landing To Test Rate", `${summary.traffic_summary.landing_to_test_rate}%`],
      ["Traffic", "Landing CTA Rate", `${summary.traffic_summary.landing_cta_rate}%`],
      ["Traffic", "Test Completion Rate", `${summary.traffic_summary.test_completion_rate}%`],
      ["Traffic", "Lead Submission Rate", `${summary.traffic_summary.lead_submission_rate}%`],
      ["Traffic Diagnosis", "Largest Dropoff From", summary.traffic_diagnosis.largest_dropoff?.from || ""],
      ["Traffic Diagnosis", "Largest Dropoff To", summary.traffic_diagnosis.largest_dropoff?.to || ""],
      ["Traffic Diagnosis", "Largest Dropoff Count", String(summary.traffic_diagnosis.largest_dropoff?.dropoff || 0)],
      [],
      ["Traffic Funnel", "Step", "Unique Users", "Conversion From Previous", "Conversion From Start"],
      ...summary.traffic_funnel.map((item) => [
        "Traffic Funnel",
        item.label,
        String(item.count),
        formatPercent(item.conversion_from_previous),
        formatPercent(item.conversion_from_start),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giugeo-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

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
              同时查看业务转化与站点流量流转，定位具体页面和交互节点的流失位置。
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-3">
              <button
                onClick={exportSummaryCsv}
                className="text-xs font-bold text-on-surface flex items-center gap-2 border border-outline-variant/30 px-3 py-2 rounded shadow-sm hover:bg-surface-container-high transition-colors uppercase tracking-widest"
              >
                导出关键数据
                <span className="material-symbols-outlined text-[14px]">download</span>
              </button>
              <button 
                onClick={fetchSummary}
                className="text-xs font-bold text-primary flex items-center gap-2 border border-outline-variant/30 px-3 py-2 rounded shadow-sm hover:bg-surface-container-high transition-colors uppercase tracking-widest"
              >
                刷新数据
                <span className="material-symbols-outlined text-[14px]">refresh</span>
              </button>
            </div>
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
          <>
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

          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">流量总览</h2>
                <p className="text-sm text-on-surface-variant">从首页访问到结果查看，观察站点真实流转而不仅是注册后的业务结果。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-outline-variant/50">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">首页访问</div>
                <div className="text-4xl font-headline font-extrabold text-on-surface">{summary.traffic_summary.landing_views}</div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-outline-variant/50">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">测试页访问</div>
                <div className="text-4xl font-headline font-extrabold text-on-surface">{summary.traffic_summary.test_page_views}</div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-outline-variant/50">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">结果页访问</div>
                <div className="text-4xl font-headline font-extrabold text-on-surface">{summary.traffic_summary.result_page_views}</div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-lg border-t-2 border-primary/50">
                <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">首页 CTA 点击率</div>
                <div className="text-4xl font-headline font-extrabold text-primary">{summary.traffic_summary.landing_cta_rate}<span className="text-sm opacity-60">%</span></div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass-panel p-8 rounded-xl border border-outline-variant/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 blur-[90px] rounded-full"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">route</span>
                流量行为漏斗
              </h2>
              <div className="space-y-4 relative z-10">
                {summary.traffic_funnel.map((step, index) => (
                  <div key={step.event_name} className="rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{step.label}</div>
                          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">{step.event_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-on-surface">{step.count}</div>
                        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">去重人数</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="rounded-lg bg-surface-container-highest/60 p-3">
                        <div className="text-on-surface-variant uppercase tracking-widest mb-1">相对上一步</div>
                        <div className="text-on-surface font-bold">{formatPercent(step.conversion_from_previous)}</div>
                      </div>
                      <div className="rounded-lg bg-surface-container-highest/60 p-3">
                        <div className="text-on-surface-variant uppercase tracking-widest mb-1">相对第一步</div>
                        <div className="text-on-surface font-bold">{formatPercent(step.conversion_from_start)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">insights</span>
                  页面诊断
                </h2>
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">首页 &rarr; 测试页</div>
                    <div className="text-3xl font-bold">{summary.traffic_summary.landing_to_test_rate}<span className="text-sm opacity-50">%</span></div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">测试页 &rarr; 完成检测</div>
                    <div className="text-3xl font-bold">{summary.traffic_summary.test_completion_rate}<span className="text-sm opacity-50">%</span></div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">检测完成 &rarr; 留资</div>
                    <div className="text-3xl font-bold text-primary">{summary.traffic_summary.lead_submission_rate}<span className="text-sm opacity-50">%</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181b] rounded-xl border border-outline-variant/30 p-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">warning</span>
                  最大流失点
                </h2>
                {summary.traffic_diagnosis.largest_dropoff ? (
                  <div className="space-y-3">
                    <div className="text-sm text-on-surface-variant">当前最大流失出现在以下节点之间：</div>
                    <div className="rounded-lg bg-surface-container-low p-4 border border-outline-variant/20">
                      <div className="font-bold text-on-surface">{summary.traffic_diagnosis.largest_dropoff.from}</div>
                      <div className="text-xs uppercase tracking-widest text-on-surface-variant my-2">↓</div>
                      <div className="font-bold text-primary">{summary.traffic_diagnosis.largest_dropoff.to}</div>
                    </div>
                    <div className="text-sm text-on-surface-variant">
                      当前净流失人数：<span className="text-on-surface font-bold">{summary.traffic_diagnosis.largest_dropoff.dropoff}</span>
                    </div>
                    <div className="text-xs leading-relaxed text-on-surface-variant/80">
                      建议优先检查这一步的页面文案、CTA 强度、表单复杂度或信任信息位置。
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-on-surface-variant">当前暂无足够流量数据来诊断最大流失点。</div>
                )}
              </div>
            </div>
          </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
