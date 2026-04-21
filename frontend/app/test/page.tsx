"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RegisterModal } from "../../components/auth/RegisterModal";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useLanguage } from "../../components/providers/LanguageProvider";
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
import { trackEvent } from "../../lib/analytics";
import { getAccessToken, getCurrentUserEmail, signOut } from "../../lib/auth";
import { loadDraft, saveDraft } from "../../lib/draft";

const testPageCopy = {
  en: {
    title: "AI Mention Audit Engine",
    description:
      "Run a deep generative-visibility analysis. We simulate real user prompts to assess how often your brand is currently mentioned.",
    entryEyebrow: "Audit Entry",
    entryTitleTop: "Check whether your brand",
    entryTitleBottom: "has entered the AI candidate set",
    freeQuota: "Free audits left",
    auditUnit: "audits",
    totalTests: "Total runs",
    totalMentions: "Mentions",
    totalExposure: "Total exposures",
    configEyebrow: "Configure the audit",
    configTitle: "Start a new audit",
    companyLabel: "Company / Brand",
    companyPlaceholder: "e.g. Huawei, Alibaba",
    keywordLabel: "Product keyword",
    keywordPlaceholder: "Enter the keyword to audit, such as mattress or gaming chair",
    industryLabel: "Industry",
    providerLabel: "Target AI model",
    promptSummaryPrefix: "We will simulate a real user asking",
    promptSummaryMiddle: "about your brand and keyword.",
    loadingButton: "Generating...",
    executeButton: "Run AI visibility audit",
    leadSubmitting: "Submitting...",
    leadSubmitted: "Submitted, waiting for advisor",
    leadRateLimited: "Already submitted within 24h",
    leadButton: "Contact sales for more quota",
    latestTitle: "Latest audit result",
    latestDescription:
      "The most recent result will appear here. You can jump directly to the full expert analysis report.",
    status: "Status",
    completed: "Completed",
    mentioned: "Mentioned",
    yes: "Yes",
    no: "No",
    exposureCount: "Exposure count",
    mentionCount: "Mention count",
    detailedReport: "View full expert analysis report",
    historyReadyEyebrow: "History Ready",
    historyReadyTitle: "Audit history is archived",
    historyReadyDescription:
      "You already have previous audit records. New results will update here, and older reports remain available in the history list below.",
    recentAction: "Recent action",
    recentActionValue: "Launch another audit",
    entryPoint: "Entry point",
    entryPointValue: "Historical report list",
    historyTitle: "Audit history",
    historyDescription: "Archived results and how your core business metrics evolve over time.",
    historyTime: "Audit time",
    historyCompany: "Brand / Company",
    historyModel: "Target model",
    historyVisibility: "Visibility result",
    historyAction: "Action",
    historyEmpty: "Your audit log will appear here.",
    historyMentioned: "Mentioned",
    historyNotMentioned: "Not mentioned",
    viewReport: "View report",
    modalSuccessEyebrow: "Request submitted",
    modalSuccessTitle: "A sales advisor will contact you soon",
    modalSuccessBody:
      "Your quota-expansion request has been submitted successfully. We will arrange advisor follow-up based on your audit history and usually reach out quickly.",
    modalInfoEyebrow: "Request received",
    modalInfoTitle: "You already submitted once today",
    modalInfoBody:
      "We have already recorded your quota request. Please wait for advisor follow-up. To avoid duplicates, another request is not available within 24 hours.",
    modalCurrentState: "Current status",
    modalLeadStatus: "Quota expansion request",
    modalLeadSubmitted: "Submitted successfully",
    modalLeadSubmittedToday: "Already submitted today",
    modalConfirm: "Got it",
    errorMissingFields: "Please enter both company name and product keyword",
    errorLoadingContext: "Loading account status. Please try again shortly.",
    errorExecuteFailed: "Audit execution failed",
    errorSubmitFailed: "Submission failed",
  },
  zh: {
    title: "AI提及率检测引擎",
    description: "执行深度生成的引擎优化分析。模拟用户的真实搜索场景分析您品牌目前的提及率。",
    entryEyebrow: "检测入口",
    entryTitleTop: "检测品牌是否进入",
    entryTitleBottom: "AI 候选池",
    freeQuota: "剩余免费次数",
    auditUnit: "次检测",
    totalTests: "总测试次数",
    totalMentions: "被提及次数",
    totalExposure: "总曝光次数",
    configEyebrow: "配置检测参数",
    configTitle: "开始一次新的检测",
    companyLabel: "公司/品牌名",
    companyPlaceholder: "例如：华为、阿里",
    keywordLabel: "产品关键词",
    keywordPlaceholder: "输入需要检测的产品关键词，如床垫、电竞椅",
    industryLabel: "所属行业",
    providerLabel: "目标 AI 模型",
    promptSummaryPrefix: "将基于你的品牌与关键词，模拟真实用户向",
    promptSummaryMiddle: "发问。",
    loadingButton: "检索生成中...",
    executeButton: "立即检测 AI 曝光度",
    leadSubmitting: "提交中...",
    leadSubmitted: "已提交，等待顾问联系",
    leadRateLimited: "24h 内已提交申请",
    leadButton: "联系销售获取更多测试额度",
    latestTitle: "最近一次检测结果",
    latestDescription: "最新检测结果会在这里更新，你可以直接跳转查看完整专家分析报告。",
    status: "状态",
    completed: "已完成",
    mentioned: "是否被提及",
    yes: "是",
    no: "否",
    exposureCount: "曝光次数",
    mentionCount: "提及次数",
    detailedReport: "查看详细专家分析报告",
    historyReadyEyebrow: "History Ready",
    historyReadyTitle: "检测历史已归档",
    historyReadyDescription: "你已经有过检测记录。新的结果会更新在这里，旧报告会继续保留在下方历史列表里。",
    recentAction: "最近动作",
    recentActionValue: "继续发起一次新的检测",
    entryPoint: "查看入口",
    entryPointValue: "历史检测报告列表",
    historyTitle: "智能评估流历史",
    historyDescription: "存档的结果与随时间变化的业务指标趋势。",
    historyTime: "检测时间",
    historyCompany: "品牌 / 公司",
    historyModel: "目标模型",
    historyVisibility: "可见性结果",
    historyAction: "操作",
    historyEmpty: "您的历史审计日志将在此填充。",
    historyMentioned: "已提及",
    historyNotMentioned: "未提及",
    viewReport: "查看报告",
    modalSuccessEyebrow: "需求已提交",
    modalSuccessTitle: "销售顾问会尽快联系您",
    modalSuccessBody: "您的扩容申请已经提交成功，我们会根据您的检测记录安排顾问跟进，通常会尽快与您联系。",
    modalInfoEyebrow: "已收到您的申请",
    modalInfoTitle: "您今天已经提交过一次需求",
    modalInfoBody: "我们已经记录过您的扩容申请，请先等待顾问联系。为避免重复提交，24 小时内暂不支持再次申请。",
    modalCurrentState: "当前状态",
    modalLeadStatus: "销售扩容申请",
    modalLeadSubmitted: "已成功提交",
    modalLeadSubmittedToday: "今日已提交过",
    modalConfirm: "我知道了",
    errorMissingFields: "请填写公司名和产品关键词",
    errorLoadingContext: "正在加载账号状态，请稍后重试",
    errorExecuteFailed: "测试执行失败",
    errorSubmitFailed: "提交失败",
  },
} as const;

const industryOptions = [
  { value: "医疗健康", zh: "医疗健康", en: "Healthcare" },
  { value: "电商品牌", zh: "电商品牌", en: "E-commerce" },
  { value: "IT科技", zh: "IT科技", en: "IT & Tech" },
  { value: "智能制造", zh: "智能制造", en: "Advanced Manufacturing" },
  { value: "传统零售", zh: "传统零售", en: "Retail" },
] as const;

export default function TestPage() {
  const { language } = useLanguage();
  const copy = testPageCopy[language];
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
  const trackedViewRef = useRef(false);
  const formStartedRef = useRef(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [industry, setIndustry] = useState("医疗健康");
  const [provider, setProvider] = useState("豆包");

  const refreshContext = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setContext(null);
      setCurrentEmail("");
      return;
    }

    setIsAuthenticated(true);
    const email = await getCurrentUserEmail();
    setCurrentEmail(email || "");

    try {
      const ctx = await getUserContext();
      setContext(ctx);
      if (ctx.is_registered) {
        try {
          const runs = await listTestRuns();
          setHistory(runs);
        } catch {
          // History fetch failure should not break the main flow
        }
      } else if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const shouldResumeBootstrap = params.get("complete_registration") === "1";
        try {
          const raw = localStorage.getItem("geo_pending_bootstrap");
          if (raw) {
            const pending = JSON.parse(raw) as { phone?: string; companyName?: string };
            setBootstrapEmail(email || "");
            setBootstrapPhone(pending.phone || "");
            setBootstrapCompany(pending.companyName || "");
            setRegisterMode("bootstrap");
            setRegisterOpen(true);
            if (shouldResumeBootstrap) {
              params.delete("complete_registration");
              const nextSearch = params.toString();
              window.history.replaceState({}, "", nextSearch ? `/test?${nextSearch}` : "/test");
            }
          }
        } catch {
          // Ignore invalid local draft data
        }
      }
    } catch (err) {
      setContext(null);
      setHistory([]);
      setError(err instanceof Error ? err.message : copy.errorLoadingContext);
    }
  }, [copy.errorLoadingContext]);

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
        trackEvent("test_result_rendered", {
          page: "test",
          test_run_id: result.test_run_id,
          provider: request.provider,
          industry: request.industry,
          is_mentioned: result.is_mentioned,
        });
        await refreshContext();
      } catch (err) {
        const message = err instanceof Error ? err.message : copy.errorExecuteFailed;
        setError(
          message === "Email verification required"
            ? (language === "zh"
                ? "请先完成邮箱验证，再开始测试。"
                : "Please verify your email before starting the audit.")
            : message
        );
      } finally {
        executeInFlightRef.current = false;
        setLoading(false);
      }
    },
    [copy.errorExecuteFailed, language, refreshContext]
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
    if (!trackedViewRef.current) {
      trackEvent("test_page_view", { page: "test" });
      trackedViewRef.current = true;
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
  const hasAnyRuns = history.length > 0 || (context?.total_query_count ?? 0) > 0;
  const showRecentResultPanel = Boolean(lastResult) || hasAnyRuns;
  const showDetailedStats = isAuthenticated && context?.is_registered && hasAnyRuns;

  const contactModalCopy = contactModalTone === "success"
    ? {
        eyebrow: copy.modalSuccessEyebrow,
        title: copy.modalSuccessTitle,
        body: copy.modalSuccessBody,
      }
    : {
        eyebrow: copy.modalInfoEyebrow,
        title: copy.modalInfoTitle,
        body: copy.modalInfoBody,
      };

  function handleFormStart() {
    if (formStartedRef.current) {
      return;
    }
    formStartedRef.current = true;
    trackEvent("test_form_started", { page: "test" });
  }

  async function handleExecuteTest() {
    trackEvent("test_execute_click", {
      page: "test",
      industry,
      provider,
      is_authenticated: isAuthenticated,
      is_registered: context?.is_registered ?? false,
    });
    if (!companyName.trim() || !productKeyword.trim()) {
      setError(copy.errorMissingFields);
      return;
    }

    const request = {
      company_name: companyName,
      product_keyword: productKeyword,
      industry,
      provider,
      language,
    };

    if (!isAuthenticated) {
      trackEvent("register_modal_open", { page: "test", source: "execute_click", reason: "not_authenticated" });
      setRegisterMode("signup");
      setRegisterOpen(true);
      return;
    }

    if (context === null) {
      setError(copy.errorLoadingContext);
      return;
    }

    if (!context.is_registered) {
      setError("");
      trackEvent("register_modal_open", { page: "test", source: "execute_click", reason: "profile_incomplete" });
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
    trackEvent("lead_click", { page: "test", source: "quota_exhausted" });
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
      trackEvent("lead_confirmation_viewed", { page: "test", source: "quota_exhausted" });
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.errorSubmitFailed;
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
    { id: "千问", icon: "chat" }
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

      <main className="max-w-screen-2xl mx-auto px-8 py-8 flex-grow w-full">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-2">{copy.title}</h1>
          <p className="text-sm md:text-base text-on-surface-variant font-body max-w-2xl">
            {copy.description}
          </p>
        </div>

        <section className="rounded-[28px] border border-outline-variant/20 overflow-hidden bg-surface-container-low/70 shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
          <div className="grid grid-cols-1 xl:grid-cols-12">
            <div className="xl:col-span-3 bg-[#141416] border-b xl:border-b-0 xl:border-r border-outline-variant/15 px-6 py-7 md:px-7 md:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-5">
                {copy.entryEyebrow}
              </div>

              <h2 className="text-[1.85rem] md:text-[2rem] font-extrabold tracking-tight text-on-surface leading-[1.08] mb-3">
                {copy.entryTitleTop}
                <br />
                {copy.entryTitleBottom}
              </h2>

              <div className="rounded-xl border border-secondary/25 bg-surface-container-low px-4 py-3.5 mb-4">
                <div className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">{copy.freeQuota}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-[2rem] leading-none font-headline font-extrabold text-secondary">{freeQuotaRemaining}</div>
                  <div className="text-[9px] uppercase tracking-widest text-on-surface-variant">{copy.auditUnit}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 min-h-[78px]">
                  <div className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">{copy.totalTests}</div>
                  <div className="text-[1.8rem] leading-none font-extrabold text-on-surface">{context?.total_query_count ?? 0}</div>
                </div>
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 min-h-[78px]">
                  <div className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">{copy.totalMentions}</div>
                  <div className="text-[1.8rem] leading-none font-extrabold text-on-surface">{context?.total_mentioned_count ?? 0}</div>
                </div>
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 min-h-[78px] col-span-2">
                  <div className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-1.5">{copy.totalExposure}</div>
                  <div className="text-[1.8rem] leading-none font-extrabold text-tertiary">{context?.total_exposure_count ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-9 px-6 py-7 md:px-8 md:py-8 flex">
              <div className="max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-bold mb-2">{copy.configEyebrow}</div>
                    <h3 className="text-2xl font-bold text-on-surface">{copy.configTitle}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.companyLabel}</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-4 transition-all text-on-surface"
                      placeholder={copy.companyPlaceholder}
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        handleFormStart();
                        setCompanyName(e.target.value);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.keywordLabel}</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-4 transition-all text-on-surface"
                      placeholder={copy.keywordPlaceholder}
                      type="text"
                      value={productKeyword}
                      onChange={(e) => {
                        handleFormStart();
                        setProductKeyword(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.industryLabel}</label>
                    <select
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-4 transition-all appearance-none text-on-surface"
                      value={industry}
                      onChange={(e) => {
                        handleFormStart();
                        setIndustry(e.target.value);
                      }}
                    >
                      {industryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {language === "zh" ? option.zh : option.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.providerLabel}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {providers.map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => {
                            handleFormStart();
                            setProvider(prov.id);
                          }}
                          type="button"
                          className={`rounded-xl border px-3 py-3 text-center transition-all flex items-center justify-center min-h-[56px] ${
                            provider === prov.id
                              ? "border-primary/35 bg-primary/10 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                              : "border-outline-variant/20 bg-surface-container-low hover:bg-surface-container"
                          }`}
                        >
                          <span className={`text-sm font-bold ${provider === prov.id ? "text-primary" : "text-on-surface"}`}>
                            {prov.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 px-5 py-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="text-sm text-on-surface">
                      {copy.promptSummaryPrefix} <span className="text-primary font-bold">{provider}</span> {copy.promptSummaryMiddle}
                    </div>

                    <div className="lg:w-[320px] shrink-0">
                      {!showContactSales ? (
                        <button
                          type="button"
                          onClick={handleExecuteTest}
                          disabled={loading}
                          className="w-full bg-primary-container text-on-surface border border-outline-variant font-headline font-extrabold text-lg py-4 rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {loading ? copy.loadingButton : copy.executeButton}
                          {!loading && <span className="material-symbols-outlined">radar</span>}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleContactSales}
                          disabled={contactLeadDisabled}
                          className={`w-full border font-headline font-extrabold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 ${
                            contactLeadDisabled
                              ? "bg-surface-container-high text-on-surface-variant border-outline-variant/40 cursor-not-allowed opacity-60"
                              : "bg-surface-bright border-outline-variant hover:bg-surface-container-highest"
                          }`}
                        >
                          {contactLeadStatus === "submitting"
                            ? copy.leadSubmitting
                            : contactLeadStatus === "submitted"
                              ? copy.leadSubmitted
                              : contactLeadStatus === "rate_limited"
                                ? copy.leadRateLimited
                                : copy.leadButton}
                          <span className="material-symbols-outlined">
                            {contactLeadStatus === "submitted" || contactLeadStatus === "rate_limited" ? "check_circle" : "support_agent"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              </div>
            </div>
          </div>
        </section>

        {showRecentResultPanel && (
          <section className="mt-10">
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-8">
              {lastResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold mb-3">Recent Result</div>
                    <h3 className="text-2xl font-bold mb-3">{copy.latestTitle}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {copy.latestDescription}
                    </p>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.status}</div>
                      <div className={lastResult.status === "completed" ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                        {lastResult.status === "completed" ? copy.completed : lastResult.status}
                      </div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.mentioned}</div>
                      <div className={lastResult.is_mentioned ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                        {lastResult.is_mentioned ? copy.yes : copy.no}
                      </div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.exposureCount}</div>
                      <div className="font-bold text-on-surface">{lastResult.exposure_count_for_query}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.mentionCount}</div>
                      <div className="font-bold text-on-surface">{lastResult.mentioned_count_for_query}</div>
                    </div>
                  </div>
                  <div className="lg:col-span-12">
                    <Link
                      href={`/result/${lastResult.test_run_id}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors"
                    >
                      {copy.detailedReport}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold mb-3">History Ready</div>
                    <h3 className="text-2xl font-bold mb-3">{copy.historyReadyTitle}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {copy.historyReadyDescription}
                    </p>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.totalTests}</div>
                      <div className="text-2xl font-bold text-on-surface">{context?.total_query_count ?? 0}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.recentAction}</div>
                      <div className="text-sm font-bold text-on-surface">{copy.recentActionValue}</div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{copy.entryPoint}</div>
                      <div className="text-sm font-bold text-on-surface">{copy.entryPointValue}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">{copy.historyTitle}</h2>
              <p className="text-on-surface-variant text-sm">{copy.historyDescription}</p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/40">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-highest/50">
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.historyTime}</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.historyCompany}</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.historyModel}</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.historyVisibility}</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.status}</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{copy.historyAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {history.length === 0 ? (
                    <tr>
                      <td className="px-8 py-20 text-center text-on-surface-variant/40 italic font-light" colSpan={6}>
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history</span>
                          {copy.historyEmpty}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.map((run) => (
                      <tr key={run.id} className="hover:bg-surface-bright/50 transition-colors">
                        <td className="px-8 py-4 text-sm whitespace-nowrap">
                          {new Date(run.created_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
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
                              {copy.historyMentioned}
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              {copy.historyNotMentioned}
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-sm opacity-80">
                          {run.status === "completed" ? copy.completed : run.status}
                        </td>
                        <td className="px-8 py-4 text-sm">
                          <Link href={`/result/${run.id}`} className="text-primary hover:underline flex items-center gap-1">
                            {copy.viewReport}
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
                      {copy.modalCurrentState}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-on-surface-variant">{copy.modalLeadStatus}</span>
                      <span className="text-primary font-bold">
                        {contactModalTone === "success" ? copy.modalLeadSubmitted : copy.modalLeadSubmittedToday}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {copy.modalConfirm}
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
