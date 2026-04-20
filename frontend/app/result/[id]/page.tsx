"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../components/layout/Header";
import { Footer } from "../../../components/layout/Footer";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { getTestRun, submitContactLead, TestRunDetail } from "../../../lib/api";
import { trackEvent } from "../../../lib/analytics";
import { getAccessToken, getCurrentUserEmail, signOut } from "../../../lib/auth";

export default function ResultPage() {
  const { language } = useLanguage();
  const copy = {
    en: {
      loading: "Loading...",
      notFound: "Test result not found",
      backToEngine: "Back to audit engine",
      title: "Expert analysis report",
      description: "This report reflects how your brand is positioned within the target AI model’s broader response strategy.",
      inputParams: "Input parameters",
      company: "Brand / Company",
      keyword: "Product keyword",
      industry: "Industry",
      engine: "Target engine",
      metrics: "Visibility metrics",
      totalExposure: "Total exposure",
      mentioned: "Mentioned",
      overallStatus: "Overall status",
      completed: "Analysis complete",
      source: "Match-source reference",
      sourceEmpty: "No explicit source was recorded",
      response: "Large-model response parse",
      noRaw: "No raw response text",
      evaluation: "AI summary evaluation",
      upliftTitle: "Want to improve your AI visibility?",
      upliftBody: "Your brand may be missing meaningful AI-generated demand. Contact our advisors and we will turn the data above into a targeted plan for knowledge-base coverage and source expansion.",
      submitted: "Your request has been submitted. Our experts will contact you soon.",
      cta: "Get a custom uplift plan",
      submitFailed: "Submission failed",
      loadFailed: "Load failed",
    },
    zh: {
      loading: "加载中...",
      notFound: "未找到测试结果",
      backToEngine: "返回检测引擎",
      title: "专家分析报告",
      description: "针对目标 AI 大模型的数据解构结果，以下反映了您的品牌在全局回答策略中的曝光顺位。",
      inputParams: "输入参数",
      company: "公司/品牌名",
      keyword: "产品关键词",
      industry: "所属行业",
      engine: "目标引擎",
      metrics: "可见性指标",
      totalExposure: "总曝光",
      mentioned: "被提及",
      overallStatus: "综合评定状态",
      completed: "分析完成",
      source: "匹配策略来源",
      sourceEmpty: "未明确标注知识来源",
      response: "大语言模型响应解析",
      noRaw: "无原始响应文本",
      evaluation: "AI 综合评价",
      upliftTitle: "想要提升您的 AI 曝光率？",
      upliftBody: "您的品牌可能正在错失大量的 AI 生成端流量。联系我们的优化顾问，我们将根据以上数据生成定向的大模型知识库覆盖和语料提升规划。",
      submitted: "您的需求已提交，我们的专家将尽快与您联系！",
      cta: "获取定制提升规划",
      submitFailed: "提交失败",
      loadFailed: "加载失败",
    },
  }[language];
  const params = useParams();
  const id = params?.id as string;

  const [run, setRun] = useState<TestRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    getAccessToken().then(token => {
      setIsAuthenticated(!!token);
    });
    getCurrentUserEmail().then(email => {
      setCurrentEmail(email || "");
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTestRun(id)
      .then((data) => {
        setRun(data);
        trackEvent("result_page_view", {
          page: "result",
          test_run_id: id,
          provider: data.input_provider,
          industry: data.input_industry,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : copy.loadFailed))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleContactSales() {
    try {
      trackEvent("lead_click", { page: "result", source: "result_cta" });
      await submitContactLead({
        test_run_id: id,
        test_summary: { is_mentioned: run?.is_mentioned },
      });
      setContactSubmitted(true);
      trackEvent("lead_confirmation_viewed", { page: "result", source: "result_cta" });
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.submitFailed);
    }
  }

  async function handleSignOut() {
    await signOut();
    setIsAuthenticated(false);
    setCurrentEmail("");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        currentEmail={currentEmail}
        onLogoutClick={handleSignOut}
        activePath="/result"
      />

      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex-grow w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-on-surface opacity-60">{copy.loading}</div>
        ) : error || !run ? (
          <div className="text-center h-64 flex flex-col justify-center items-center">
            <p className="text-red-400 mb-4">{error || copy.notFound}</p>
            <Link href="/test" className="text-primary hover:underline">← {copy.backToEngine}</Link>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <Link href="/test" className="inline-flex items-center gap-2 text-primary hover:text-primary-container transition-colors mb-6 text-sm font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                {copy.backToEngine}
              </Link>
              <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-2">{copy.title}</h1>
              <p className="text-on-surface-variant font-body max-w-2xl">
                {copy.description}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-4 space-y-6">
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/30">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">manage_search</span>
                    {copy.inputParams}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2">
                      <span className="text-xs text-on-surface-variant">{copy.company}</span>
                      <span className="font-bold text-sm text-right">{run.input_company_name}</span>
                    </div>
                    <div className="flex flex-col border-b border-outline-variant/20 pb-2 gap-1">
                      <span className="text-xs text-on-surface-variant">{copy.keyword}</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="bg-surface-container-highest px-2 py-1 rounded text-xs font-mono text-primary">
                          {run.input_product_keyword}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2">
                      <span className="text-xs text-on-surface-variant">{copy.industry}</span>
                      <span className="font-bold text-sm text-right">{run.input_industry}</span>
                    </div>
                    <div className="flex justify-between items-end pb-2">
                      <span className="text-xs text-on-surface-variant">{copy.engine}</span>
                      <span className="font-bold text-sm text-right flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        {run.input_provider}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">donut_large</span>
                    {copy.metrics}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-4 rounded text-center border border-outline-variant/30">
                      <div className="text-3xl font-headline font-black mb-1">{run.exposure_count_for_query ?? 0}</div>
                      <div className="text-[10px] uppercase text-on-surface-variant">{copy.totalExposure}</div>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded text-center border border-outline-variant/30">
                      <div className="text-3xl font-headline font-black mb-1 text-primary">{run.mentioned_count_for_query ?? 0}</div>
                      <div className="text-[10px] uppercase text-on-surface-variant">{copy.mentioned}</div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center text-sm border-t border-outline-variant/20 pt-4">
                    <span className="text-on-surface-variant">{copy.overallStatus}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${run.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-500"}`}>
                      {run.status === "completed" ? copy.completed : run.status}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/30">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">{copy.source}</h3>
                  <p className="text-sm opacity-80 break-all">{run.final_match_source || copy.sourceEmpty}</p>
                </div>
              </section>

              <section className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-xl p-8 border border-outline-variant/30 relative">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">data_exploration</span>
                    {copy.response}
                  </h2>
                  <div className="bg-surface-container-lowest p-6 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap border border-outline-variant/20 max-h-[400px] overflow-y-auto">
                    {run.raw_response_text || copy.noRaw}
                  </div>
                </div>

                {run.evaluation_text && (
                  <div className="bg-[#18181b] rounded-xl p-8 border-l-4 border-primary">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">psychology</span>
                      {copy.evaluation}
                    </h2>
                    <p className="text-on-surface-variant leading-relaxed">
                      {run.evaluation_text}
                    </p>
                  </div>
                )}

                <div className="bg-surface-container-highest rounded-xl p-8 border border-outline-variant overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">trending_up</span>
                    {copy.upliftTitle}
                  </h2>
                  <p className="text-on-surface-variant mb-6 relative z-10 max-w-lg">
                    {copy.upliftBody}
                  </p>
                  <div className="relative z-10">
                    {contactSubmitted ? (
                      <div className="bg-green-500/20 text-green-400 p-4 rounded border border-green-500/30 flex items-center gap-3">
                        <span className="material-symbols-outlined">check_circle</span>
                        {copy.submitted}
                      </div>
                    ) : (
                      <button
                        onClick={handleContactSales}
                        className="bg-primary text-on-primary font-bold px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        {copy.cta}
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
