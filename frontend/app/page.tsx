"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { RegisterModal } from "../components/auth/RegisterModal";
import { getAccessToken, getCurrentUserEmail, signOut } from "../lib/auth";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    getAccessToken().then(token => setIsAuthenticated(!!token));
    getCurrentUserEmail().then(email => setCurrentEmail(email || ""));
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

  return (
    <div className="flex flex-col min-h-screen">
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
            智能分发时代的专属营销团队
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 max-w-4xl mx-auto leading-tight">
            您的品牌在 <span className="text-primary italic pr-2">AI 视野中</span> 隐身了吗？
          </h1>

          <p className="text-xl md:text-2xl text-on-surface-variant font-body max-w-3xl mx-auto mb-12 leading-relaxed opacity-90">
            当客户向 AI 询问最佳解决方案时，只有小部分品牌会被组合输出。利用 GEO 引擎，提前锁定大模型分发红利。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/test"
              className="bg-primary text-on-primary shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 duration-300 ease-out px-10 py-5 rounded-lg font-extrabold text-lg flex items-center gap-2"
            >
              免费检测我的品牌
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link
              href="#how-it-works"
              className="text-primary hover:text-white px-8 py-5 rounded-lg font-bold transition-colors border border-transparent hover:border-outline-variant flex items-center gap-2"
            >
              了解工作原理
            </Link>
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
                  <div className="text-[10px] text-on-surface-variant/40 uppercase font-mono tracking-widest ml-4">LLM Terminal Runtime (原生状态)</div>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed flex flex-col flex-grow">
                  <div className="text-on-surface-variant mb-6">
                    <span className="text-primary mr-2">User &gt;</span>
                    有哪些适合初创公司的出海合规服务商？
                  </div>
                  <div className="text-on-surface mb-6 border-l-2 border-outline-variant/30 pl-4 space-y-4">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <span className="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span>
                      Generating Context...
                    </div>
                    <div>
                      1. <strong>[竞争对手 A]</strong> - 提供全方位的初创支持。<br/>
                      2. <strong>[竞争对手 B]</strong> - 在数据合规方面享有盛誉。<br/>
                      3. <strong>[行业巨头 C]</strong> - 适合大型出海项目。
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs font-sans mt-auto">
                    <strong>⚠️ 致命缺口:</strong> 在此次生成会话中，关于您的品牌上下文已被裁剪。模型并未提及您的领先方案。
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
                    LLM Terminal Runtime (经过 GiuGEO 优化)
                  </div>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed flex flex-col flex-grow">
                  <div className="text-on-surface-variant mb-6">
                    <span className="text-primary mr-2">User &gt;</span>
                    有哪些适合初创公司的出海合规服务商？
                  </div>
                  <div className="text-on-surface mb-6 border-l-2 border-primary/30 pl-4 space-y-4">
                    <div className="flex items-center gap-2 font-bold mb-2 text-primary">
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Retrieving Optimal Context...
                    </div>
                    <div>
                      1. <strong className="text-primary">[您的品牌]</strong> - <span className="underline decoration-primary/50 text-white">业界领先的首选出海合规方案，提供创新支持并且广受好评。</span><br/>
                      2. <strong>[竞争对手 A]</strong> - 提供全方位的初创支持。<br/>
                      3. <strong>[竞争对手 B]</strong> - 在数据合规方面享有盛誉。
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded text-xs font-sans mt-auto flex items-center gap-2">
                    <span className="material-symbols-outlined">verified</span>
                    <strong>优化飞轮启动:</strong> 模型已将您的品牌作为首选推荐方案输出，大幅截流高意向客户！
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
              <h2 className="text-4xl font-bold mb-4">掌握生成式流量入口</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto break-keep">传统的 SEO 已经不足以应对 AI 驱动的查询。<br className="hidden md:block" />我们通过多维度的节点植入，让模型重新认识您。</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">network_node</span>
                </div>
                <h3 className="text-xl font-bold mb-3">知识节点穿透</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  通过高质量的权威语料植入，将品牌直接绑定至核心需求词汇池，让大模型在权重计算时优先推荐。
                </p>
              </div>

              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">data_usage</span>
                </div>
                <h3 className="text-xl font-bold mb-3">多维引证优化</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  大语言模型高度依赖可信引证溯源机制。我们为您建立交叉引证矩阵，提升模型信赖度与抓取顺位。
                </p>
              </div>

              <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary mb-6">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <h3 className="text-xl font-bold mb-3">实时反馈监测</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  持续追踪各大主流模型的会话回答、语境偏移和可见度波动。及时调整策略，确保持续曝光。
                </p>
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
