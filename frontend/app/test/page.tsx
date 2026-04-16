"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RegisterModal } from "../../components/auth/RegisterModal";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import {
  executeTest,
  getUserContext,
  listTestRuns,
  submitContactLead,
  UserContext,
  ExecuteTestResponse,
  ExecuteTestRequest,
  TestRunSummary,
} from "../../lib/api";
import { getAccessToken, getCurrentUserEmail, signOut } from "../../lib/auth";
import { loadDraft, saveDraft } from "../../lib/draft";

export default function TestPage() {
  const contactLeadCooldownMs = 24 * 60 * 60 * 1000;
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<"signup" | "bootstrap">("signup");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPhone, setBootstrapPhone] = useState("");
  const [bootstrapCompany, setBootstrapCompany] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<ExecuteTestResponse | null>(null);
  const [pendingRequest, setPendingRequest] = useState<ExecuteTestRequest | null>(null);
  const [history, setHistory] = useState<TestRunSummary[]>([]);
  const [contactLeadStatus, setContactLeadStatus] = useState<"idle" | "submitting" | "submitted" | "rate_limited">("idle");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalTone, setContactModalTone] = useState<"success" | "info">("success");
  const [contactLeadCooldownUntil, setContactLeadCooldownUntil] = useState<number | null>(null);
  const pendingRequestRef = useRef<ExecuteTestRequest | null>(null);
  const executeInFlightRef = useRef(false);
  const bootstrapInFlightRef = useRef(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [industry, setIndustry] = useState("医疗健康");
  const [provider, setProvider] = useState("豆包");

  const refreshContext = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setContext(null);
        return;
      }
      setIsAuthenticated(true);
      const email = await getCurrentUserEmail();
      setCurrentEmail(email || "");
      const ctx = await getUserContext();
      setContext(ctx);
      if (ctx.is_registered) {
        try {
          const runs = await listTestRuns();
          setHistory(runs);
        } catch {
          // History fetch failure should not break the main flow
        }
      }
    } catch {
      setIsAuthenticated(false);
      setContext(null);
      setCurrentEmail("");
    }
  }, []);

  const executeRequest = useCallback(
    async (request: ExecuteTestRequest) => {
      if (executeInFlightRef.current) {
        return;
      }
      executeInFlightRef.current = true;
      setError("");
      setLoading(true);
      try {
        const result = await executeTest(request);
        setLastResult(result);
        await refreshContext();
      } catch (err) {
        setError(err instanceof Error ? err.message : "测试执行失败");
      } finally {
        executeInFlightRef.current = false;
        setLoading(false);
      }
    },
    [refreshContext]
  );

  const handleBootstrapSuccess = useCallback(async () => {
    if (bootstrapInFlightRef.current) {
      return;
    }
    bootstrapInFlightRef.current = true;
    const request = pendingRequestRef.current;
    pendingRequestRef.current = null;
    setPendingRequest(null);
    setRegisterOpen(false);
    try {
      await refreshContext();
      if (request) {
        await executeRequest(request);
      }
    } finally {
      bootstrapInFlightRef.current = false;
    }
  }, [executeRequest, refreshContext]);

  // Load draft and check auth on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setCompanyName(draft.companyName);
      setProductKeyword(draft.productKeyword);
      setIndustry(draft.industry);
      setProvider(draft.provider);
    }
    refreshContext();
  }, [refreshContext]);

  // Save draft on form changes
  useEffect(() => {
    saveDraft({ companyName, productKeyword, industry, provider });
  }, [companyName, productKeyword, industry, provider]);

  useEffect(() => {
    if (contactLeadCooldownUntil === null) {
      return;
    }

    const remaining = contactLeadCooldownUntil - Date.now();
    if (remaining <= 0) {
      setContactLeadCooldownUntil(null);
      setContactLeadStatus((current) =>
        current === "submitted" || current === "rate_limited" ? "idle" : current
      );
      return;
    }

    const timer = window.setTimeout(() => {
      setContactLeadCooldownUntil(null);
      setContactLeadStatus((current) =>
        current === "submitted" || current === "rate_limited" ? "idle" : current
      );
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [contactLeadCooldownUntil]);

  const freeQuotaRemaining = context?.free_test_quota_remaining ?? 3;
  const showContactSales = isAuthenticated && context?.is_registered && freeQuotaRemaining <= 0;
  const contactLeadDisabled = contactLeadStatus === "submitting" || contactLeadStatus === "submitted" || contactLeadStatus === "rate_limited";

  const contactModalCopy = contactModalTone === "success"
    ? {
        eyebrow: "需求已提交",
        title: "销售顾问会尽快联系您",
        body: "您的扩容申请已经提交成功，我们会根据您的检测记录安排顾问跟进，通常会尽快与您联系。",
      }
    : {
        eyebrow: "已收到您的申请",
        title: "您今天已经提交过一次需求",
        body: "我们已经记录过您的扩容申请，请先等待顾问联系。为避免重复提交，24 小时内暂不支持再次申请。",
      };

  async function handleExecuteTest() {
    if (!companyName.trim() || !productKeyword.trim()) {
      setError("请填写公司名和产品关键词");
      return;
    }

    const request = {
      company_name: companyName,
      product_keyword: productKeyword,
      industry,
      provider,
    };

    if (!isAuthenticated) {
      setRegisterMode("signup");
      setRegisterOpen(true);
      return;
    }

    if (context === null) {
      setError("正在加载账号状态，请稍后重试");
      return;
    }

    if (!context.is_registered) {
      setError("");
      pendingRequestRef.current = request;
      setPendingRequest(request);
      setRegisterMode("bootstrap");
      const email = await getCurrentUserEmail() || "";
      setBootstrapEmail(email);

      try {
        const raw = localStorage.getItem("geo_pending_bootstrap");
        if (raw) {
          const pending = JSON.parse(raw) as { phone?: string; companyName?: string };
          setBootstrapPhone(pending.phone || "");
          setBootstrapCompany(pending.companyName || "");
        }
      } catch { /* ignore */ }

      setRegisterOpen(true);
      return;
    }

    await executeRequest(request);
  }

  async function handleSignOut() {
    await signOut();
    setIsAuthenticated(false);
    setContext(null);
    setCurrentEmail("");
    setHistory([]);
    setContactLeadStatus("idle");
    setContactLeadCooldownUntil(null);
    setContactModalOpen(false);
  }

  async function handleContactSales() {
    if (contactLeadDisabled) {
      return;
    }
    setError("");
    setContactLeadStatus("submitting");
    try {
      await submitContactLead({
        test_run_id: lastResult?.test_run_id,
        test_summary: { total_query_count: context?.total_query_count },
      });
      setContactLeadCooldownUntil(Date.now() + contactLeadCooldownMs);
      setContactLeadStatus("submitted");
      setContactModalTone("success");
      setContactModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败";
      if (message.includes("24 hours")) {
        setContactLeadCooldownUntil((current) => current ?? Date.now() + contactLeadCooldownMs);
        setContactLeadStatus("rate_limited");
        setContactModalTone("info");
        setContactModalOpen(true);
        return;
      }
      setContactLeadStatus("idle");
      setError(message);
    }
  }

  const providers = [
    { id: "豆包", icon: "forum" },
    { id: "ChatGPT", icon: "bolt" },
    { id: "DeepSeek", icon: "radar" },
    { id: "通义", icon: "chat" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        currentEmail={currentEmail}
        onLoginClick={() => { setRegisterMode("signup"); setRegisterOpen(true); }}
        onLogoutClick={handleSignOut}
        activePath="/test"
      />

      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex-grow w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-2">AI提及率检测引擎</h1>
          <p className="text-on-surface-variant font-body max-w-2xl">
            执行深度生成的引擎优化分析。模拟用户的真实搜索场景分析您品牌目前的提及率。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container-low p-6 rounded-lg transition-all hover:bg-surface-container-high group">
            <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">总测试次数</div>
            <div className="text-4xl font-headline font-extrabold text-on-surface">{context?.total_query_count ?? 0}</div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg transition-all hover:bg-surface-container-high">
            <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">被提及次数</div>
            <div className="text-4xl font-headline font-extrabold text-on-surface">{context?.total_mentioned_count ?? 0}</div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg transition-all hover:bg-surface-container-high">
            <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">总曝光次数</div>
            <div className="text-4xl font-headline font-extrabold text-tertiary">{context?.total_exposure_count ?? 0}</div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg border-l-4 border-secondary transition-all hover:bg-surface-container-high">
            <div className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-4">剩余免费次数</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-headline font-extrabold text-secondary">{freeQuotaRemaining}</div>
              <div className="text-xs opacity-60">次检测请求</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8">
            <div className="glass-panel p-10 rounded-xl relative overflow-hidden h-full">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">analytics</span>
                配置检测参数
              </h2>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 relative z-10">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">公司/品牌名</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 transition-all text-on-surface"
                      placeholder="例如：华为、阿里"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">所属行业</label>
                    <select
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 transition-all appearance-none text-on-surface"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      <option value="医疗健康">医疗健康</option>
                      <option value="电商品牌">电商品牌</option>
                      <option value="IT科技">IT科技</option>
                      <option value="智能制造">智能制造</option>
                      <option value="传统零售">传统零售</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">产品关键词</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-4 transition-all text-on-surface"
                    placeholder="输入需要检测的产品关键词，如床垫、电竞椅"
                    type="text"
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                  />
                  <p className="text-[10px] text-on-surface-variant/60">这些关键词将用于定位和评估大模型的反馈倾向。</p>
                </div>

                <div className="space-y-4 relative z-10">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">目标 AI 模型</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {providers.map((prov) => (
                      <button
                        key={prov.id}
                        onClick={() => setProvider(prov.id)}
                        type="button"
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all group ${
                          provider === prov.id
                            ? "bg-surface-container-highest border-primary shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                            : "bg-surface-container-low hover:bg-surface-container-highest border-transparent"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-3xl mb-2 ${provider === prov.id ? "text-primary" : "opacity-40 group-hover:opacity-100"}`}>
                          {prov.icon}
                        </span>
                        <span className={`font-bold text-sm ${provider === prov.id ? "" : "opacity-60 group-hover:opacity-100"}`}>
                          {prov.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <div className="pt-6 border-t border-outline-variant/30 relative z-10">
                  {!showContactSales ? (
                    <button
                      type="button"
                      onClick={handleExecuteTest}
                      disabled={loading}
                      className="w-full bg-primary-container text-on-surface border border-outline-variant font-headline font-extrabold text-xl py-5 rounded-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? "检索生成中..." : "评估 AI 曝光度"}
                      {!loading && <span className="material-symbols-outlined">radar</span>}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContactSales}
                      disabled={contactLeadDisabled}
                      className={`w-full border font-headline font-extrabold text-xl py-5 rounded-lg transition-all flex items-center justify-center gap-3 ${
                        contactLeadDisabled
                          ? "bg-surface-container-high text-on-surface-variant border-outline-variant/40 cursor-not-allowed opacity-60"
                          : "bg-surface-bright border-outline-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      {contactLeadStatus === "submitting"
                        ? "提交中..."
                        : contactLeadStatus === "submitted"
                          ? "已提交，等待顾问联系"
                          : contactLeadStatus === "rate_limited"
                            ? "24h 内已提交申请"
                            : "联系销售获取更多测试额度"}
                      <span className="material-symbols-outlined">
                        {contactLeadStatus === "submitted" || contactLeadStatus === "rate_limited" ? "check_circle" : "support_agent"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-4">
            <div className="h-full flex flex-col">
              <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant/30 h-full min-h-[400px]">
                {lastResult ? (
                  <>
                    <h3 className="text-xl font-bold mb-4">最近一次检测结果</h3>
                    <div className="w-full space-y-4 text-left">
                      <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                        <span className="text-on-surface-variant">状态</span>
                        <span className={lastResult.status === "completed" ? "text-green-400" : "text-yellow-400"}>
                          {lastResult.status === "completed" ? "已完成" : lastResult.status}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                        <span className="text-on-surface-variant">是否被提及</span>
                        <span className={lastResult.is_mentioned ? "text-green-400" : "text-red-400"}>
                          {lastResult.is_mentioned ? "是" : "否"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                        <span className="text-on-surface-variant">曝光次数</span>
                        <span>{lastResult.exposure_count_for_query}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                        <span className="text-on-surface-variant">提及次数</span>
                        <span>{lastResult.mentioned_count_for_query}</span>
                      </div>
                    </div>
                    <Link
                      href={`/result/${lastResult.test_run_id}`}
                      className="mt-6 flex items-center gap-2 text-primary hover:text-white transition-colors"
                    >
                      查看详细专家分析报告 →
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">cloud_off</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">近期暂无记录</h3>
                    <p className="text-on-surface-variant text-sm max-w-[240px]">配置参数并开始您的首次 GEO 评估，在此查看实时可见性指标。</p>
                    <div className="mt-8 p-4 bg-surface-container-lowest rounded border border-outline-variant/30 text-left w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary">为何我们需要大模型曝光?</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-70">
                        70% 的企业用户在进行品牌调研时依赖大语言模型。如果您的品牌不在其上下文窗口中，在未来的AI智能分发中就将丧失流量先机。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">智能评估流历史</h2>
              <p className="text-on-surface-variant text-sm">存档的结果与随时间变化的业务指标趋势。</p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/40">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-highest/50">
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">检测时间</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">品牌 / 公司</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">目标模型</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">可见性结果</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">状态</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {history.length === 0 ? (
                    <tr>
                      <td className="px-8 py-20 text-center text-on-surface-variant/40 italic font-light" colSpan={6}>
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history</span>
                          您的历史审计日志将在此填充。
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.map((run) => (
                      <tr key={run.id} className="hover:bg-surface-bright/50 transition-colors">
                        <td className="px-8 py-4 text-sm whitespace-nowrap">
                          {new Date(run.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-8 py-4 text-sm font-bold">
                          {run.input_company_name}
                        </td>
                        <td className="px-8 py-4">
                          <span className="inline-block bg-surface-container-highest px-3 py-1 rounded text-xs">
                            {run.input_provider}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm">
                          {run.is_mentioned ? (
                            <span className="text-green-400 font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              已提及
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              未提及
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-sm opacity-80">
                          {run.status === "completed" ? "已完成" : run.status}
                        </td>
                        <td className="px-8 py-4 text-sm">
                          <Link href={`/result/${run.id}`} className="text-primary hover:underline flex items-center gap-1">
                            查看报告
                            <span className="material-symbols-outlined text-[14px]">chart_data</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <RegisterModal
          open={registerOpen}
          mode={registerMode}
          bootstrapEmail={bootstrapEmail}
          bootstrapPhone={bootstrapPhone}
          bootstrapCompany={bootstrapCompany}
          onClose={() => setRegisterOpen(false)}
          onSuccess={registerMode === "bootstrap" ? handleBootstrapSuccess : refreshContext}
        />

        {contactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-outline-variant/40 bg-[#09090b] shadow-2xl shadow-black/60 overflow-hidden">
              <div className="relative p-8">
                <div className={`absolute top-0 right-0 h-40 w-40 blur-[90px] rounded-full ${
                  contactModalTone === "success" ? "bg-primary/20" : "bg-surface-bright/30"
                }`}></div>
                <div className="relative z-10">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${
                    contactModalTone === "success"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-outline-variant/40 bg-surface-container-high text-on-surface-variant"
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {contactModalTone === "success" ? "verified" : "schedule"}
                    </span>
                    {contactModalCopy.eyebrow}
                  </div>

                  <h3 className="text-3xl font-extrabold tracking-tight text-on-surface mb-4">
                    {contactModalCopy.title}
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed mb-8">
                    {contactModalCopy.body}
                  </p>

                  <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-4 mb-8">
                    <div className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                      当前状态
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-on-surface-variant">销售扩容申请</span>
                      <span className="text-primary font-bold">
                        {contactModalTone === "success" ? "已成功提交" : "今日已提交过"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    我知道了
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
