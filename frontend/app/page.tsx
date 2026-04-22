"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useLanguage } from "../components/providers/LanguageProvider";
import { RegisterModal } from "../components/auth/RegisterModal";
import { trackEvent } from "../lib/analytics";
import { getAccessToken, getCurrentUserEmail, signOut } from "../lib/auth";
import { saveDraft } from "../lib/draft";
import { landingContent, trendLines } from "../lib/landing-copy";

export default function LandingPage() {
  const { language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const trackedViewRef = useRef(false);
  const trackedLandingSectionsRef = useRef(new Set<string>());
  const trackedScrollDepthRef = useRef(new Set<number>());
  const teamAdvantageCarouselRef = useRef<HTMLDivElement | null>(null);

  const copy = landingContent[language] as typeof landingContent.en;
  const trendSignals = copy.trendSignals;
  const faqsData = copy.faqsData;
  const industriesData = copy.industriesData;
  const geoEngineNodes = copy.geoEngineNodes;
  const geoMethodLayers = copy.geoMethodLayers;
  const geoDeliveryPoints = copy.geoDeliveryPoints;
  const teamAdvantageCards = copy.teamAdvantageCards;
  const staticCopy = copy.static;
  const activeData = industriesData[selectedIndustryIdx];
  const splitRecommendation = (text: string) => {
    const [label, ...rest] = text.split(" - ");
    return {
      label,
      detail: rest.join(" - "),
    };
  };

  const handleIndustryCTA = (industryLabel: string, draftIndustry: string) => {
    trackEvent("landing_industry_cta_click", {
      page: "landing",
      industry: industryLabel,
    });
    try {
      saveDraft({
        companyName: "",
        productKeyword: "",
        industry: draftIndustry,
        provider: "豆包",
      });
    } catch {}
    window.location.assign("/test");
  };

  useEffect(() => {
    if (!trackedViewRef.current) {
      trackEvent("landing_view", { page: "landing" });
      trackedViewRef.current = true;
    }
    getAccessToken().then(token => setIsAuthenticated(!!token));
    getCurrentUserEmail().then(email => setCurrentEmail(email || ""));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const sectionIds = ["industry-analysis", "product-capability", "team-advantage", "faq"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const sectionId = entry.target.id;
          if (trackedLandingSectionsRef.current.has(sectionId)) {
            return;
          }
          trackedLandingSectionsRef.current.add(sectionId);
          trackEvent("landing_section_view", {
            page: "landing",
            section_id: sectionId,
          });
        });
      },
      { threshold: 0.35 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];

    const handleScrollDepth = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight - viewportHeight;
      const percent = fullHeight <= 0 ? 100 : Math.min(100, Math.round((scrollTop / fullHeight) * 100));

      thresholds.forEach((threshold) => {
        if (percent >= threshold && !trackedScrollDepthRef.current.has(threshold)) {
          trackedScrollDepthRef.current.add(threshold);
          trackEvent("landing_scroll_depth", {
            page: "landing",
            depth_percent: threshold,
          });
        }
      });
    };

    handleScrollDepth();
    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    window.addEventListener("resize", handleScrollDepth);
    return () => {
      window.removeEventListener("scroll", handleScrollDepth);
      window.removeEventListener("resize", handleScrollDepth);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    setIsAuthenticated(false);
    setCurrentEmail("");
  }

  function handleAuthSuccess() {
    getAccessToken().then(token => setIsAuthenticated(!!token));
    getCurrentUserEmail().then(email => setCurrentEmail(email || ""));
    setRegisterOpen(false);
  }

  function scrollTeamAdvantages(direction: "prev" | "next") {
    const node = teamAdvantageCarouselRef.current;
    if (!node) {
      return;
    }
    const distance = Math.min(node.clientWidth * 0.92, 980);
    node.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex flex-col min-h-screen" id="top">
      <Header
        isAuthenticated={isAuthenticated}
        currentEmail={currentEmail}
        onLoginClick={() => setRegisterOpen(true)}
        onLogoutClick={handleSignOut}
        activePath="/"
      />

      <main className="flex-grow w-full relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Hero Section */}
        <section className="relative z-10 max-w-screen-2xl mx-auto px-8 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            {staticCopy.heroEyebrow}
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 max-w-4xl mx-auto leading-tight">
            {staticCopy.heroTitlePrefix} <span className="text-primary italic pr-2">{staticCopy.heroTitleHighlight}</span> {staticCopy.heroTitleSuffix}
          </h1>

          <p className="text-xl md:text-2xl text-on-surface-variant font-body max-w-3xl mx-auto mb-12 leading-relaxed opacity-90">
            {staticCopy.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/test"
              onClick={() => trackEvent("landing_primary_cta_click", { page: "landing", source: "hero" })}
              className="bg-primary text-on-primary shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 duration-300 ease-out px-10 py-5 rounded-lg font-extrabold text-lg flex items-center gap-2"
            >
              {staticCopy.primaryCta}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link
              href="#how-it-works"
              className="text-primary hover:text-white px-8 py-5 rounded-lg font-bold transition-colors border border-transparent hover:border-outline-variant flex items-center gap-2"
            >
              {staticCopy.secondaryCta}
            </Link>
          </div>
        </section>

        {/* Trend Signal Module */}
        <section className="relative z-10 max-w-screen-2xl mx-auto px-8 pb-28">
          <div className="rounded-[28px] border border-outline-variant/20 bg-surface-container-low/70 backdrop-blur-sm overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 items-stretch">
              <div className="xl:col-span-4 p-8 md:p-10 xl:p-10 border-b xl:border-b-0 xl:border-r border-outline-variant/20 flex">
                <div className="w-full flex flex-col justify-center max-w-[440px]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-[0.22em] mb-6">
                  {staticCopy.trendEyebrow}
                </div>
                <h2 className="text-3xl md:text-[2.45rem] font-extrabold tracking-tighter text-on-surface mb-4 leading-[1.05]">
                  {staticCopy.trendTitleTop}
                  <br />
                  {staticCopy.trendTitleBottom}
                </h2>
                <p className="text-on-surface-variant text-[15px] leading-relaxed max-w-md mb-7">
                  {staticCopy.trendDescription}
                </p>

                <div className="space-y-3">
                  {trendSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-2xl border border-outline-variant/15 bg-[#0f0f12] px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="text-[2rem] md:text-[2.1rem] leading-none font-extrabold tracking-tight text-primary">{signal.value}</div>
                        <span className="material-symbols-outlined text-on-surface-variant/35 text-[16px]">north_east</span>
                      </div>
                      <div className="text-[14px] font-semibold text-on-surface leading-snug">{signal.label}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mt-2">
                        {signal.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>

              <div className="xl:col-span-8 p-8 md:p-10 xl:p-10 relative bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] flex">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4610_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4610_1px,transparent_1px)] bg-[size:44px_44px] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 w-full flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-2">{staticCopy.indexedTrend}</div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{staticCopy.trendChartTitle}</h3>
                    </div>
                    <div className="hidden md:flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-outline-variant/70"></span>
                        {staticCopy.traditionalLegend}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-primary"></span>
                        {staticCopy.aiLegend}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/15 bg-[#09090b]/90 p-5 md:p-6">
                    <svg viewBox="0 0 580 170" className="w-full h-auto" role="img" aria-label={staticCopy.comparisonAria}>
                      <defs>
                        <linearGradient id="aiLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,1)" />
                        </linearGradient>
                        <linearGradient id="areaFade" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>

                      {[26, 58, 90, 122].map((y) => (
                        <line key={y} x1="24" y1={y} x2="552" y2={y} stroke="rgba(161,161,170,0.18)" strokeWidth="1" strokeDasharray="5 7" />
                      ))}

                      <path d={`${trendLines.ai} L548 150 L32 150 Z`} fill="url(#areaFade)" />
                      <path d={trendLines.traditional} fill="none" stroke="rgba(161,161,170,0.9)" strokeWidth="3" strokeLinecap="round" />
                      <path d={trendLines.ai} fill="none" stroke="url(#aiLineGlow)" strokeWidth="4" strokeLinecap="round" />

                      {[
                        { x: 32, y: 144, year: "2022" },
                        { x: 160, y: 132, year: "2023" },
                        { x: 288, y: 104, year: "2024" },
                        { x: 416, y: 62, year: "2025" },
                        { x: 548, y: 24, year: "2026" },
                      ].map((point) => (
                        <g key={point.year}>
                          <circle cx={point.x} cy={point.y} r="5" fill="#09090b" stroke="white" strokeWidth="2" />
                          <text x={point.x} y="164" textAnchor="middle" fill="rgba(161,161,170,0.85)" fontSize="11" letterSpacing="0.18em">
                            {point.year}
                          </text>
                        </g>
                      ))}

                      <g>
                        <line x1="350" y1="24" x2="350" y2="146" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 6" />
                        <rect x="286" y="14" width="128" height="24" rx="12" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" />
                        <text x="350" y="30" textAnchor="middle" fill="rgba(250,250,250,0.86)" fontSize="10" letterSpacing="0.08em">
                          {language === "zh" ? "ChatGPT Search 上线" : "ChatGPT Search launches"}
                        </text>
                      </g>

                      <g>
                        <line x1="468" y1="18" x2="468" y2="126" stroke="rgba(255,255,255,0.22)" strokeDasharray="4 6" />
                        <rect x="413" y="8" width="110" height="24" rx="12" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" />
                        <text x="468" y="24" textAnchor="middle" fill="rgba(250,250,250,0.86)" fontSize="10" letterSpacing="0.08em">
                          {language === "zh" ? "AI 搜索进入普及期" : "AI search enters the mainstream"}
                        </text>
                      </g>
                    </svg>
                  </div>

                  <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-black/20 px-5 py-5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">Traffic Mix Shift</div>
                        <div className="text-sm font-semibold text-on-surface">{staticCopy.trendCardTitle}</div>
                      </div>
                      <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-outline-variant/70"></span>
                          {language === "zh" ? "传统搜索" : "Traditional search"}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-primary"></span>
                          {language === "zh" ? "AI 发现入口" : "AI discovery"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { year: "2023", search: 86, ai: 14 },
                        { year: "2024", search: 72, ai: 28 },
                        { year: "2025", search: 54, ai: 46 },
                      ].map((item) => (
                        <div key={item.year} className="grid grid-cols-[52px_1fr_48px] items-center gap-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{item.year}</div>
                          <div className="h-3 rounded-full bg-surface-container-highest overflow-hidden flex">
                            <div
                              className="h-full bg-outline-variant/75"
                              style={{ width: `${item.search}%`, transition: "width 600ms ease" }}
                            ></div>
                            <div
                              className="h-full bg-primary shadow-[0_0_16px_rgba(255,255,255,0.16)]"
                              style={{ width: `${item.ai}%`, transition: "width 600ms ease" }}
                            ></div>
                          </div>
                          <div className="text-right text-xs font-semibold text-on-surface">{item.ai}%</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/40 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">Signal</div>
                        <div className="text-sm text-on-surface">{staticCopy.trendSteps[0]}</div>
                      </div>
                      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/40 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">Shift</div>
                        <div className="text-sm text-on-surface">{staticCopy.trendSteps[1]}</div>
                      </div>
                      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/40 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant mb-1">Result</div>
                        <div className="text-sm text-on-surface">{staticCopy.trendSteps[2]}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Threat Demo Window */}
        <section className="max-w-screen-2xl mx-auto px-8 mb-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-2 rounded-2xl border border-outline-variant/30 shadow-2xl shadow-black/50 opacity-80 lg:scale-95 origin-right">
              <div className="bg-[#09090b] rounded-xl overflow-hidden h-full flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#18181b] border-b border-outline-variant/20">
                  <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
                  <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
                  <div className="w-3 h-3 rounded-full bg-outline-variant/50"></div>
                  <div className="text-[10px] text-on-surface-variant/40 uppercase font-mono tracking-widest ml-4">{staticCopy.rawTerminal}</div>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed flex flex-col flex-grow">
                  <div className="text-on-surface-variant mb-6">
                    <span className="text-primary mr-2">User &gt;</span>
                    {staticCopy.terminalQuestion}
                  </div>
                  <div className="text-on-surface mb-6 border-l-2 border-outline-variant/30 pl-4 space-y-4">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <span className="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span>
                      Generating Context...
                    </div>
                    <div>
                      1. <strong>{splitRecommendation(staticCopy.rawList[0]).label}</strong> - {splitRecommendation(staticCopy.rawList[0]).detail}<br/>
                      2. <strong>{splitRecommendation(staticCopy.rawList[1]).label}</strong> - {splitRecommendation(staticCopy.rawList[1]).detail}<br/>
                      3. <strong>{splitRecommendation(staticCopy.rawList[2]).label}</strong> - {splitRecommendation(staticCopy.rawList[2]).detail}
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs font-sans mt-auto">
                    <strong>⚠️ {staticCopy.fatalGapTitle}</strong> {staticCopy.fatalGapBody}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-2 rounded-2xl border border-primary/40 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative origin-left">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-transparent opacity-20 blur-lg rounded-2xl animate-pulse"></div>
              <div className="bg-[#09090b] rounded-xl overflow-hidden h-full flex flex-col relative z-10">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#18181b] border-b border-primary/20">
                  <div className="w-3 h-3 rounded-full bg-primary/80"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                  <div className="text-[10px] text-primary uppercase font-mono tracking-widest ml-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    {staticCopy.optimizedTerminal}
                  </div>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed flex flex-col flex-grow">
                  <div className="text-on-surface-variant mb-6">
                    <span className="text-primary mr-2">User &gt;</span>
                    {staticCopy.terminalQuestion}
                  </div>
                  <div className="text-on-surface mb-6 border-l-2 border-primary/30 pl-4 space-y-4">
                    <div className="flex items-center gap-2 font-bold mb-2 text-primary">
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Retrieving Optimal Context...
                    </div>
                    <div>
                      1. <strong className="text-primary">{splitRecommendation(staticCopy.optimizedListFirst).label}</strong> - <span className="underline decoration-primary/50 text-white">{splitRecommendation(staticCopy.optimizedListFirst).detail}</span><br/>
                      2. <strong>{splitRecommendation(staticCopy.rawList[0]).label}</strong> - {splitRecommendation(staticCopy.rawList[0]).detail}<br/>
                      3. <strong>{splitRecommendation(staticCopy.rawList[1]).label}</strong> - {splitRecommendation(staticCopy.rawList[1]).detail}
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded text-xs font-sans mt-auto flex items-center gap-2">
                    <span className="material-symbols-outlined">verified</span>
                    <strong>{staticCopy.flywheelTitle}</strong> {staticCopy.flywheelBody}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="how-it-works" className="bg-surface-container-low border-t border-outline-variant/20 pt-24 pb-32">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{staticCopy.featureTitle}</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto break-keep">{staticCopy.featureDescriptionTop}<br className="hidden md:block" />{staticCopy.featureDescriptionBottom}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">network_node</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{staticCopy.featureCards[0].title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {staticCopy.featureCards[0].body}
                </p>
              </div>

              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">data_usage</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{staticCopy.featureCards[1].title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {staticCopy.featureCards[1].body}
                </p>
              </div>

              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{staticCopy.featureCards[2].title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {staticCopy.featureCards[2].body}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Scenarios Module */}
        <section id="industry-analysis" className="bg-surface relative py-32 overflow-hidden border-t border-outline-variant/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4610_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4610_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-screen-2xl mx-auto px-8 relative z-10">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">{staticCopy.industryTitle}</h2>
              <p className="text-xl text-on-surface-variant max-w-3xl">
                {staticCopy.industryDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[500px]">
              {/* Left sidebar: Industry cards wrapped in a panel for equal height */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-surface rounded-2xl border border-outline-variant/30 p-2 flex flex-col justify-between gap-2 h-full shadow-lg">
                  {industriesData.map((ind, idx) => {
                    const isActive = selectedIndustryIdx === idx;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => setSelectedIndustryIdx(idx)}
                        className={`text-left relative flex-1 flex flex-col justify-center p-5 rounded-xl transition-all duration-300 pointer ${
                          isActive 
                            ? "bg-surface-container border border-outline-variant/50 shadow-md scale-[1.01]" 
                            : "bg-transparent border border-transparent hover:bg-surface-container-low"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-primary"></div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`material-symbols-outlined text-[24px] ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                            {ind.icon}
                          </span>
                          <h3 className={`text-base font-bold ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}>
                            {ind.name}
                          </h3>
                        </div>
                        <p className={`text-xs pl-9 leading-relaxed ${isActive ? "text-on-surface-variant" : "text-on-surface-variant/50"}`}>
                          {ind.riskDesc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: Details terminal */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-[#09090b] rounded-2xl border border-outline-variant/30 p-8 flex flex-col h-full relative overflow-hidden shadow-lg">
                  
                  <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/20 pb-4 relative z-10">
                    <span className="material-symbols-outlined text-[28px] text-primary">{activeData.icon}</span>
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">{activeData.name} {staticCopy.industryTerminalSuffix}</h3>
                    <span className="ml-auto text-[10px] uppercase font-mono tracking-widest px-2 py-1 rounded bg-[#000000] border border-outline-variant/20 text-on-surface-variant">
                      {activeData.tag}
                    </span>
                  </div>

                  <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">search</span>
                        {staticCopy.industryUserAsk}
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg font-mono text-sm border border-outline-variant/20 text-on-surface-variant">
                        "{activeData.queryExample}"
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        {staticCopy.industryBias}
                      </div>
                      <div className="text-sm leading-relaxed text-on-surface-variant">
                        {activeData.bias}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        {staticCopy.industryRisk}
                      </div>
                      <div className="border-l-[3px] border-primary/50 pl-4 py-2">
                        <p className="text-sm font-bold text-on-surface leading-relaxed">
                          {activeData.risk}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-outline-variant/20 mt-auto">
                      <div className="text-[11px] uppercase font-bold tracking-widest text-primary mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">model_training</span>
                        {staticCopy.industryIntervention}
                      </div>
                      <p className="text-sm leading-relaxed mb-6 text-on-surface-variant">
                        {activeData.strategy}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20 flex flex-col gap-3">
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span>
                            {staticCopy.industryBefore}
                          </span>
                          <span className="text-sm text-on-surface-variant/80">{activeData.beforeGeo}</span>
                        </div>
                        <div className="bg-primary/5 p-5 rounded-lg border border-primary/20 flex flex-col gap-3">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            {staticCopy.industryAfter}
                          </span>
                          <span className="text-sm text-on-surface-variant tracking-wide leading-relaxed">{activeData.afterGeo}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-outline-variant/20 relative z-10 w-full">
                    <button 
                      onClick={() => handleIndustryCTA(activeData.name, activeData.draftValue)}
                      className="w-full py-4 rounded-xl font-bold text-[14px] tracking-widest transition-all border hover:scale-[1.01] flex justify-center items-center gap-2 bg-primary text-on-primary border-transparent hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                      {staticCopy.industryCtaPrefix}【{activeData.name}】{language === "zh" ? "的 AI 曝光" : " for AI visibility"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Capability Module */}
        <section id="product-capability" className="relative py-32 overflow-hidden border-t border-outline-variant/20 bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_38%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4612_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4612_1px,transparent_1px)] bg-[size:44px_44px] opacity-20 pointer-events-none"></div>

          <div className="max-w-screen-2xl mx-auto px-8 relative z-10">
            <div className="max-w-4xl mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                {staticCopy.productEyebrow}
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-5 text-on-surface">
                {staticCopy.productTitle}
              </h2>
              <p className="text-xl text-on-surface-variant max-w-3xl leading-relaxed">
                {staticCopy.productDescription}
              </p>
            </div>

            <div className="relative rounded-[32px] border border-outline-variant/25 bg-surface-container-low/70 backdrop-blur-sm p-8 md:p-10 xl:p-14 shadow-[0_32px_90px_rgba(0,0,0,0.25)]">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-6 items-center">
                <div className="xl:col-span-4 space-y-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold">
                    {staticCopy.productEngineLabel}
                  </div>
                  <h3 className="text-3xl md:text-[2.35rem] font-extrabold tracking-tight leading-[1.05] text-on-surface">
                    {staticCopy.productEngineTitle}
                  </h3>
                  <p className="text-on-surface-variant text-[15px] leading-relaxed max-w-md">
                    {staticCopy.productEngineBody}
                  </p>
                </div>

                <div className="xl:col-span-8">
                  <div className="relative min-h-[620px] xl:min-h-[620px]">
                    <div className="hidden xl:block absolute inset-0">
                      <div className="absolute left-[50%] top-[50%] w-[440px] h-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"></div>
                      <div className="absolute left-[50%] top-[50%] w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline-variant/15"></div>
                      <div className="absolute left-[50%] top-[50%] w-[2px] h-[150px] -translate-x-1/2 -translate-y-[210px] bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0"></div>
                      <div className="absolute left-[50%] top-[50%] w-[2px] h-[150px] -translate-x-1/2 translate-y-[58px] bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0"></div>
                      <div className="absolute left-[50%] top-[50%] w-[150px] h-[2px] -translate-y-1/2 -translate-x-[230px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0"></div>
                      <div className="absolute left-[50%] top-[50%] w-[150px] h-[2px] -translate-y-1/2 translate-x-[80px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0"></div>
                    </div>

                    <div className="hidden xl:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[290px] h-[290px] rounded-full border border-primary/20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.11),rgba(9,9,11,0.95)_68%)] shadow-[0_0_80px_rgba(255,255,255,0.08)] items-center justify-center">
                      <div className="text-center max-w-[190px]">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-on-primary mb-5 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                          <span className="material-symbols-outlined text-[28px]">neurology</span>
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-2">
                          Core System
                        </div>
                        <div className="text-2xl font-extrabold tracking-tight text-on-surface mb-3">
                          GiuGEO
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          {language === "zh"
                            ? "从问题到答案，从证据到分发，形成一套持续提升 AI 可见性的生产系统。"
                            : "From question design to evidence and distribution, we run a production system that continuously improves AI visibility."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:hidden">
                      <div className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(9,9,11,0.96)_72%)] px-6 py-8 text-center shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-on-primary mb-4">
                          <span className="material-symbols-outlined text-[28px]">neurology</span>
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-2">
                          Core System
                        </div>
                        <div className="text-2xl font-extrabold tracking-tight text-on-surface mb-3">
                          GiuGEO
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant max-w-md mx-auto">
                          {language === "zh"
                            ? "从问题到答案，从证据到分发，形成一套持续提升 AI 可见性的生产系统。"
                            : "From question design to evidence and distribution, we run a production system that continuously improves AI visibility."}
                        </p>
                      </div>
                    </div>

                    <div className="xl:absolute xl:left-[6%] xl:top-[50%] xl:-translate-y-1/2 mt-4 xl:mt-0">
                      <div className="rounded-2xl border border-outline-variant/20 bg-[#0d0d10]/95 px-5 py-5 w-full xl:w-[230px] shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">{geoEngineNodes[0].icon}</span>
                          </div>
                          <div className="text-lg font-bold tracking-tight text-on-surface">{geoEngineNodes[0].title}</div>
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          {geoEngineNodes[0].description}
                        </p>
                      </div>
                    </div>

                    <div className="xl:absolute xl:left-1/2 xl:top-[2%] xl:-translate-x-1/2 mt-4 xl:mt-0">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-5 w-full xl:w-[230px] shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">{geoEngineNodes[1].icon}</span>
                          </div>
                          <div className="text-lg font-bold tracking-tight text-on-surface">{geoEngineNodes[1].title}</div>
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          {geoEngineNodes[1].description}
                        </p>
                      </div>
                    </div>

                    <div className="xl:absolute xl:right-[6%] xl:top-[50%] xl:-translate-y-1/2 mt-4 xl:mt-0">
                      <div className="rounded-2xl border border-outline-variant/20 bg-[#0d0d10]/95 px-5 py-5 w-full xl:w-[230px] shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">{geoEngineNodes[2].icon}</span>
                          </div>
                          <div className="text-lg font-bold tracking-tight text-on-surface">{geoEngineNodes[2].title}</div>
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          {geoEngineNodes[2].description}
                        </p>
                      </div>
                    </div>

                    <div className="xl:absolute xl:left-1/2 xl:bottom-[2%] xl:-translate-x-1/2 mt-4 xl:mt-0">
                      <div className="rounded-2xl border border-outline-variant/20 bg-[#0d0d10]/95 px-5 py-5 w-full xl:w-[230px] shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">{geoEngineNodes[3].icon}</span>
                          </div>
                          <div className="text-lg font-bold tracking-tight text-on-surface">{geoEngineNodes[3].title}</div>
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          {geoEngineNodes[3].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              <div className="xl:col-span-6 rounded-[28px] border border-outline-variant/20 bg-surface-container-low/60 p-7 md:p-8 shadow-xl h-full">
                <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-3">
                  {staticCopy.methodEyebrow}
                </div>
                <h3 className="text-2xl md:text-[2rem] font-extrabold tracking-tight text-on-surface mb-4">
                  {staticCopy.methodTitle}
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant mb-6 max-w-xl">
                  {staticCopy.methodDescription}
                </p>
                <div className="space-y-3">
                  {geoMethodLayers.map((layer, idx) => (
                    <div
                      key={layer.title}
                      className="grid grid-cols-[34px_1fr] gap-4 rounded-2xl border border-outline-variant/15 bg-black/20 px-4 py-4"
                    >
                      <div className="w-[34px] h-[34px] rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black tracking-widest">
                        0{idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface mb-1">{layer.title}</div>
                        <div className="text-sm leading-relaxed text-on-surface-variant">{layer.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-6 rounded-[28px] border border-outline-variant/20 bg-[#0b0b0e] p-7 md:p-8 shadow-xl overflow-hidden relative h-full flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-3">
                    {staticCopy.deliveryEyebrow}
                  </div>
                  <h3 className="text-2xl md:text-[2rem] font-extrabold tracking-tight text-on-surface mb-4">
                    {staticCopy.deliveryTitle}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant mb-6 max-w-xl">
                    {staticCopy.deliveryDescription}
                  </p>

                  <div className="space-y-4">
                    {geoDeliveryPoints.map((point) => (
                      <div
                        key={point.title}
                        className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/40 px-5 py-5"
                      >
                        <div className="flex items-end justify-between gap-4 mb-3">
                          <div className="text-lg font-bold tracking-tight text-on-surface">{point.title}</div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">
                            {point.value}
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed text-on-surface-variant">
                          {point.detail}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold mb-2">
                        {staticCopy.operatingPrinciple}
                      </div>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {staticCopy.operatingPrincipleBody}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Advantage Module */}
        <section id="team-advantage" className="relative py-20 overflow-hidden border-t border-outline-variant/20 bg-surface-container-low">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_34%)] pointer-events-none"></div>

          <div className="max-w-screen-2xl mx-auto px-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                  {staticCopy.teamEyebrow}
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-3 text-on-surface">
                  {staticCopy.teamTitle}
                </h2>
                <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
                  {staticCopy.teamDescription}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => scrollTeamAdvantages("prev")}
                  className="w-14 h-14 rounded-full border border-outline-variant/20 bg-surface text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center"
                  aria-label={staticCopy.prevCardLabel}
                >
                  <span className="material-symbols-outlined text-[22px]">west</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollTeamAdvantages("next")}
                  className="w-14 h-14 rounded-full border border-outline-variant/20 bg-surface text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center"
                  aria-label={staticCopy.nextCardLabel}
                >
                  <span className="material-symbols-outlined text-[22px]">east</span>
                </button>
              </div>
            </div>

            <div
              ref={teamAdvantageCarouselRef}
              className="flex gap-8 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {teamAdvantageCards.map((card, idx) => (
                <article
                  key={card.title}
                  className="group relative min-w-[92vw] md:min-w-[86vw] xl:min-w-[1180px] max-w-[1180px] snap-start rounded-[34px] border border-outline-variant/20 bg-[#121215] shadow-[0_28px_80px_rgba(0,0,0,0.28)] flex-shrink-0 overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-90 pointer-events-none ${
                    card.accent === "violet"
                      ? "bg-[radial-gradient(circle_at_15%_30%,rgba(116,80,255,0.28),transparent_38%)]"
                      : card.accent === "amber"
                        ? "bg-[radial-gradient(circle_at_85%_22%,rgba(245,158,11,0.22),transparent_34%)]"
                        : card.accent === "cyan"
                          ? "bg-[radial-gradient(circle_at_88%_30%,rgba(34,211,238,0.24),transparent_34%)]"
                          : card.accent === "emerald"
                            ? "bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.20),transparent_34%)]"
                            : "bg-[radial-gradient(circle_at_82%_78%,rgba(244,63,94,0.20),transparent_34%)]"
                  }`}></div>

                  {idx === 0 && (
                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] min-h-[580px]">
                      <div className="px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex flex-col">
                        <div className="text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-10">
                          {card.step}
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-4">
                          {card.eyebrow}
                        </div>
                        <h3 className="text-3xl md:text-[3.2rem] font-extrabold tracking-tight text-on-surface mb-4 leading-[0.98] max-w-[10ch]">
                          {card.title}
                        </h3>
                        <p className="text-base md:text-xl leading-relaxed text-on-surface-variant max-w-xl mb-8">
                          {card.description}
                        </p>
                        <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-3">
                          {card.bullets.map((bullet) => (
                            <div key={bullet} className="rounded-2xl border border-outline-variant/12 bg-black/20 px-4 py-4 text-sm leading-relaxed text-on-surface">
                              {bullet}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative border-t xl:border-t-0 xl:border-l border-outline-variant/10 px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%)] pointer-events-none"></div>
                        <div className="relative w-full max-w-[420px] aspect-square">
                          <div className="absolute inset-[14%] rounded-full border border-outline-variant/15"></div>
                          <div className="absolute inset-[28%] rounded-full border border-outline-variant/10"></div>
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36%] h-[36%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.75),rgba(255,255,255,0.18)_35%,rgba(0,0,0,0.2)_100%)] shadow-[0_0_50px_rgba(255,255,255,0.12)] animate-pulse"></div>
                          <div className="absolute left-1/2 top-[12%] -translate-x-1/2 w-[18%] h-[18%] rounded-full transition-transform duration-500 group-hover:-translate-y-2 bg-violet-400/95 shadow-[0_0_30px_rgba(255,255,255,0.12)]"></div>
                          <div className="absolute left-[12%] top-1/2 -translate-y-1/2 w-[18%] h-[18%] rounded-full transition-transform duration-500 group-hover:-translate-x-2 bg-fuchsia-300/95 shadow-[0_0_30px_rgba(255,255,255,0.12)]"></div>
                          <div className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[18%] h-[18%] rounded-full transition-transform duration-500 group-hover:translate-x-2 bg-indigo-300/95 shadow-[0_0_30px_rgba(255,255,255,0.12)]"></div>
                          <div className="absolute left-1/2 top-[21%] -translate-x-1/2 w-[2px] h-[18%] bg-white/25"></div>
                          <div className="absolute left-[24%] top-1/2 -translate-y-1/2 w-[18%] h-[2px] bg-white/25"></div>
                          <div className="absolute right-[24%] top-1/2 -translate-y-1/2 w-[18%] h-[2px] bg-white/25"></div>
                          <div className="absolute left-0 right-0 bottom-0 rounded-[28px] border border-outline-variant/12 bg-black/25 backdrop-blur-sm px-5 py-5">
                            <div className="flex items-end justify-between gap-4 mb-4">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">
                                  {card.visualTitle}
                                </div>
                                <div className="text-2xl font-extrabold tracking-tight text-on-surface">
                                  {card.visualStat}
                                </div>
                              </div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">
                                GiuGEO
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {card.visualPoints.map((point) => (
                                <div key={point} className="rounded-xl border border-outline-variant/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                                  {point}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] min-h-[580px]">
                      <div className="px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex flex-col justify-between">
                        <div>
                          <div className="text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-10">{card.step}</div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-4">{card.eyebrow}</div>
                          <h3 className="text-3xl md:text-[3rem] font-extrabold tracking-tight text-on-surface mb-4 leading-[1] max-w-[10ch]">
                            {card.title}
                          </h3>
                          <p className="text-base md:text-xl leading-relaxed text-on-surface-variant max-w-lg">
                            {card.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-8">
                          {card.bullets.map((bullet) => (
                            <span key={bullet} className="px-4 py-3 rounded-full border border-outline-variant/12 bg-black/20 text-sm text-on-surface">
                              {bullet}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="relative border-t xl:border-t-0 xl:border-l border-outline-variant/10 px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex items-center">
                        <div className="w-full">
                          <div className="mb-8 flex items-end justify-between">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">{card.visualTitle}</div>
                              <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">{card.visualStat}</div>
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">Workflow</div>
                          </div>
                          <div className="space-y-5">
                            {card.visualPoints.map((point, pointIdx) => (
                              <div key={point} className="grid grid-cols-[24px_1fr] gap-4 items-center">
                                <div className="text-sm font-black text-primary">{pointIdx + 1}</div>
                                <div>
                                  <div className="h-3 rounded-full bg-black/20 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        pointIdx === 0 ? "w-[72%] bg-gradient-to-r from-amber-500 to-orange-400" :
                                        pointIdx === 1 ? "w-[88%] bg-gradient-to-r from-orange-500 to-amber-300" :
                                        pointIdx === 2 ? "w-[64%] bg-gradient-to-r from-yellow-500 to-orange-500" :
                                        "w-[94%] bg-gradient-to-r from-amber-300 to-yellow-400"
                                      } transition-all duration-700 group-hover:w-full`}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-sm text-on-surface">{point}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.88fr_1.12fr] min-h-[580px]">
                      <div className="px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex flex-col justify-between">
                        <div>
                          <div className="text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-10">{card.step}</div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-4">{card.eyebrow}</div>
                          <h3 className="text-3xl md:text-[3rem] font-extrabold tracking-tight text-on-surface mb-4 leading-[1] max-w-[10ch]">
                            {card.title}
                          </h3>
                          <p className="text-base md:text-xl leading-relaxed text-on-surface-variant max-w-lg">
                            {card.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-8">
                          {card.bullets.map((bullet) => (
                            <div key={bullet} className="rounded-2xl border border-outline-variant/12 bg-black/20 px-4 py-4 text-sm text-on-surface">
                              {bullet}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative border-t xl:border-t-0 xl:border-l border-outline-variant/10 px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex items-center justify-center overflow-hidden">
                        <div className="absolute right-0 top-0 w-56 h-56 bg-cyan-400/10 blur-[90px] rounded-full"></div>
                        <div className="w-full max-w-[460px]">
                          <div className="flex items-end justify-between mb-6">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">{card.visualTitle}</div>
                              <div className="text-3xl font-extrabold tracking-tight text-on-surface">{card.visualStat}</div>
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">Public Reach</div>
                          </div>
                          <div className="relative h-[270px] rounded-[28px] border border-outline-variant/12 bg-black/20 overflow-hidden">
                            <div className="absolute left-10 top-8 right-10 bottom-10">
                              <div className="absolute inset-0 grid grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((line) => (
                                  <div key={line} className="border-r border-dashed border-white/15 last:border-r-0"></div>
                                ))}
                              </div>
                              <svg viewBox="0 0 360 190" className="absolute inset-0 w-full h-full">
                                <path d="M0 130 L55 92 L110 116 L165 80 L220 104 L275 58 L330 22" fill="none" stroke="#22d3ee" strokeWidth="3" />
                                <path d="M0 170 L55 170 L55 150 L110 150 L110 130 L165 130 L165 118 L220 118 L220 95 L275 95 L275 72 L330 72" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="square" className="transition-all duration-700 group-hover:translate-y-[-4px]" />
                              </svg>
                            </div>
                            <div className="absolute left-5 right-5 bottom-5 grid grid-cols-2 gap-2">
                              {card.visualPoints.map((point) => (
                                <div key={point} className="rounded-xl border border-outline-variant/10 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                                  {point}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idx === 3 && (
                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] min-h-[580px]">
                      <div className="px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex flex-col">
                        <div className="text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-10">{card.step}</div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-4">{card.eyebrow}</div>
                        <h3 className="text-3xl md:text-[3rem] font-extrabold tracking-tight text-on-surface mb-4 leading-[1] max-w-[11ch]">
                          {card.title}
                        </h3>
                        <p className="text-base md:text-xl leading-relaxed text-on-surface-variant max-w-lg mb-8">
                          {card.description}
                        </p>
                        <div className="space-y-3 mt-auto">
                          {card.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-center gap-3 text-sm text-on-surface">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)]"></span>
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative border-t xl:border-t-0 xl:border-l border-outline-variant/10 px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex items-center">
                        <div className="w-full">
                          <div className="flex items-end justify-between mb-6">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">{card.visualTitle}</div>
                              <div className="text-3xl font-extrabold tracking-tight text-on-surface">{card.visualStat}</div>
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">Evidence Stack</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-[26px] border border-outline-variant/12 bg-black/20 p-5 transition-transform duration-500 group-hover:-translate-y-1">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">Signal Sources</div>
                              <div className="space-y-2">
                                {card.visualPoints.map((point) => (
                                  <div key={point} className="rounded-xl bg-black/25 border border-outline-variant/10 px-3 py-3 text-sm text-on-surface">
                                    {point}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-[26px] border border-outline-variant/12 bg-black/20 p-5 transition-transform duration-500 group-hover:translate-y-1">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">Verification Pattern</div>
                              <div className="space-y-3">
                                <div className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-400/20"></div>
                                <div className="h-14 rounded-2xl bg-gradient-to-r from-lime-500/20 to-transparent border border-lime-400/20"></div>
                                <div className="h-14 rounded-2xl bg-gradient-to-r from-teal-500/20 to-transparent border border-teal-400/20"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idx === 4 && (
                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] min-h-[580px]">
                      <div className="px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex flex-col justify-between">
                        <div>
                          <div className="text-6xl md:text-7xl font-black tracking-tight text-on-surface mb-10">{card.step}</div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold mb-4">{card.eyebrow}</div>
                          <h3 className="text-3xl md:text-[3rem] font-extrabold tracking-tight text-on-surface mb-4 leading-[1] max-w-[11ch]">
                            {card.title}
                          </h3>
                          <p className="text-base md:text-xl leading-relaxed text-on-surface-variant max-w-lg">
                            {card.description}
                          </p>
                        </div>
                        <div className="pt-8 grid grid-cols-1 gap-3">
                          {card.bullets.map((bullet) => (
                            <div key={bullet} className="rounded-2xl border border-outline-variant/12 bg-black/20 px-4 py-4 text-sm text-on-surface">
                              {bullet}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative border-t xl:border-t-0 xl:border-l border-outline-variant/10 px-8 py-8 md:px-10 md:py-10 xl:px-12 xl:py-12 flex items-center">
                        <div className="w-full">
                          <div className="flex items-end justify-between mb-6">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">{card.visualTitle}</div>
                              <div className="text-3xl font-extrabold tracking-tight text-on-surface">{card.visualStat}</div>
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">Monitoring</div>
                          </div>
                          <div className="relative h-[280px] rounded-[28px] border border-outline-variant/12 bg-black/20 overflow-hidden p-6">
                            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/10"></div>
                            <div className="absolute left-[15%] top-6 bottom-6 w-[1px] bg-white/10"></div>
                            <div className="absolute left-[50%] top-6 bottom-6 w-[1px] bg-white/10"></div>
                            <div className="absolute left-[85%] top-6 bottom-6 w-[1px] bg-white/10"></div>
                            <div className="relative h-full flex items-end justify-between">
                              {card.visualPoints.map((point, pointIdx) => (
                                <div key={point} className="flex flex-col items-center gap-3">
                                  <div className={`w-4 rounded-full ${
                                    pointIdx === 0 ? "h-20 bg-rose-300/85" :
                                    pointIdx === 1 ? "h-32 bg-rose-400/90" :
                                    "h-44 bg-rose-500/95"
                                  } transition-all duration-700 group-hover:scale-y-110 origin-bottom shadow-[0_0_24px_rgba(244,63,94,0.18)]`}></div>
                                  <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">{point}</div>
                                </div>
                              ))}
                            </div>
                            <div className="absolute right-6 top-6 rounded-2xl border border-outline-variant/12 bg-black/25 px-4 py-3">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant mb-1">Current State</div>
                              <div className="text-xl font-extrabold text-on-surface">{card.visualStat}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 text-on-surface-variant">
              <div className="text-[11px] uppercase tracking-[0.18em]">
                {staticCopy.carouselHint}
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 hover:-translate-x-0.5">west</span>
                <div className="w-12 h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-primary/60 animate-pulse"></div>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 hover:translate-x-0.5">east</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Module */}
        <section id="faq" className="bg-surface-container-low relative py-32 overflow-hidden border-t border-outline-variant/20">
          <div className="max-w-screen-2xl mx-auto px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
              
              {/* Left: Accordion list */}
              <div className="lg:col-span-7 flex flex-col gap-4 order-2 lg:order-1">
                {faqsData.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div 
                      key={idx}
                      className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? "border-outline-variant/50 bg-surface-container-high shadow-lg" 
                          : "border-outline-variant/20 bg-surface hover:bg-surface-container hover:border-outline-variant/40"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${idx}`}
                        className="w-full text-left px-6 py-5 flex items-center justify-between pointer"
                      >
                        <span className={`text-[15px] font-bold ${isOpen ? "text-primary" : "text-on-surface"}`}>
                          {faq.q}
                        </span>
                        <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-on-surface-variant"}`}>
                          keyboard_arrow_down
                        </span>
                      </button>
                      <div 
                        id={`faq-panel-${idx}`}
                        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-on-surface-variant/90 leading-relaxed text-[13px]">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Title & Intro */}
              <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-6 self-start">
                  {staticCopy.faqEyebrow}
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-on-surface">
                  {staticCopy.faqTitleTop}<br/>{staticCopy.faqTitleBottom}
                </h2>
                <p className="text-lg text-on-surface-variant max-w-md leading-relaxed mb-8">
                  {staticCopy.faqDescription}
                </p>
                <div className="mb-10 mt-2">
                  <Link
                    href="/test"
                    className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-300 pointer"
                  >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    {staticCopy.faqCta}
                  </Link>
                </div>
                <div className="flex gap-2 items-center opacity-50">
                  <div className="w-12 h-1 bg-outline-variant/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />

      <RegisterModal
        open={registerOpen}
        mode="signup"
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
