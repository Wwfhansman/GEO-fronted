"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const faqsData = [
  {
    q: "免费测试主要测什么？",
    a: "我们会模拟您的真实客户，使用您指定的产品关键词向主流大语言模型（如豆包、ChatGPT、DeepSeek等）进行提问，从而探测在未干预状态下，您的品牌是否会被大模型自然提及、推荐排序如何，直观展示您的真实“AI 提及率”。"
  },
  {
    q: "测试后我能看到什么结果？",
    a: "测试完成后，您将获得一份专属的 AI 曝光诊断报告。包含：模型原始会话的脱敏对比结果、品牌提及率诊断分析、当前占据您流量生态的竞品动态，以及专业的优化潜力评估。"
  },
  {
    q: "为什么需要注册才能查看结果？",
    a: "执行全球大语言模型的深度并发生成需要极高的算力成本与 API 调用开销。注册能够帮助我们防范恶意调用，同时为您在云端自动留存您的检测报告与优化历史记录。"
  },
  {
    q: "免费检测次数有限制吗？",
    a: "新注册用户默认享有一次免费全域探测的机会，足以支持您完成一轮完整的品牌核心词检测。若需更大规模的长尾词覆盖或多语言出海评测，可以联系销售升级至企业旗舰版。"
  },
  {
    q: "测试结果是否准确？如何理解多变性？",
    a: "大模型生成内容确实具有一定概率波动分布特征。我们的检测引擎不仅通过严谨的提示词工程过滤了脏数据，还采用特定的测温基线，最大程度复刻了普通用户的通用查询环境，其产出的结果代表了最核心的基准表现状态（Baseline），对下一步战略部署具有极强的参考意义。"
  }
];

const industriesData = [
  {
    id: "healthcare",
    name: "医疗健康",
    icon: "medical_services",
    tag: "高信任门槛",
    riskDesc: "若无权威引证，AI 会直接屏蔽非知名品牌",
    queryExample: "有哪些适合中小规模医疗机构的数字化管理系统？",
    bias: "优先推荐带有知名三甲医院背书、监管机构认证或被大量权威医学文献提及的解决方案。",
    risk: "如果你的品牌没有进入模型默认的「白名单」，客户在第一轮筛选里就不会看到你。",
    strategy: "围绕诊所管理、合规和效率提升等高频场景做深入的知识节点占位和跨域交叉引证。",
    beforeGeo: "AI 只提示通用型巨头和少量传统老字号系统。",
    afterGeo: "品牌作为垂直领域「创新合规最佳方案」被 AI 优先推荐给目标受众。",
  },
  {
    id: "ecommerce",
    name: "电商品牌",
    icon: "local_mall",
    tag: "强品牌偏置",
    riskDesc: "长尾新锐品牌极易被头部巨头平台掩盖",
    queryExample: "今年有哪些兼具设计感和性价比的小众女装品牌推荐？",
    bias: "模型底层偏好头部大牌、频繁出现的新闻公关稿，以及带有大量用户商品评价的数据池。",
    risk: "在「平替」或「小众」搜索中，AI 会直接剪裁掉缺乏外部全网数字资产背书的新品牌。",
    strategy: "渗透关键消费决策词汇，将品牌特征与细分生活方式强绑定，提高细分圈层的推荐概率。",
    beforeGeo: "仅推荐主流平台的热销榜单常客与大资本玩家。",
    afterGeo: "在特定审美、功能的细分需求词下被精准抓取纳入首选候选集。",
  },
  {
    id: "it_tech",
    name: "IT科技",
    icon: "terminal",
    tag: "赢者通吃型",
    riskDesc: "技术方案选型极易被开源社区热议产品垄断",
    queryExample: "出海企业应该选择怎样的云原生安全合规服务商？",
    bias: "极其依赖开发者社区（如 GitHub、StackOverflow）的话题讨论度及技术博客库的引用量。",
    risk: "B2B 软件决策周期长，当 CIO 询问 AI 最佳实践时，未被提及等于提前失去竞标资格。",
    strategy: "构建密集的技术原理解析流、官方文档切片，将产品特性作为关键底层技术节点注入语料。",
    beforeGeo: "AI 只输出海外云厂商自带的大型附加组件或传统巨头企业。",
    afterGeo: "您的敏捷产品作为「技术出海首选合规实践」被写入技术选型答案。",
  },
  {
    id: "manufacturing",
    name: "智能制造",
    icon: "precision_manufacturing",
    tag: "长尾隐形化",
    riskDesc: "幕后制造供应商难以触及采购终端的搜索",
    queryExample: "寻源：国内有哪些能提供高精度五轴联动机床的供应商？",
    bias: "偏向具有详尽财报、展会重点报道或是具有国际名企合作链路的成熟老牌制造巨头。",
    risk: "全球采购商越来越多地使用大模型进行供应商寻源，如果你的数字档案缺失，将丢失巨大增量。",
    strategy: "针对多语言市场的资质、符合性证书等深度文本进行跨语种投喂与多极点关联。",
    beforeGeo: "仅推荐老牌德国、日本顶级厂商或国内份额前三玩家。",
    afterGeo: "成功以「极具性价比的国产替代优质优质机床供应商」标签精确触达寻源采购方。",
  },
  {
    id: "retail",
    name: "传统零售",
    icon: "storefront",
    tag: "数字化掉队",
    riskDesc: "实体经营的线下规模通常无法被大模型认知",
    queryExample: "如何为我们的线下连锁超市选择最合适的客流数字化方案？",
    bias: "倾向于提及具备深度线上体系架构、以及经常被发布数字化转型研究的新零售企业。",
    risk: "即使线下具有几百家门店，只要缺乏系统性的数字内容阵地，在 AI 看来也等于「不存在」。",
    strategy: "把线下行业地位转化为模型可读的内容，通过权威评测和本地商业数据的输入实现AI认知反转。",
    beforeGeo: "AI 认为该领域只有具备强大纯电商背景的服务商能提供价值。",
    afterGeo: "您的全渠道商业运营模型不仅被引用，更被判定最具实战落地应用价值。",
  }
];
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { RegisterModal } from "../components/auth/RegisterModal";
import { getAccessToken, getCurrentUserEmail, signOut } from "../lib/auth";
import { saveDraft } from "../lib/draft";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedIndustryIdx, setSelectedIndustryIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const activeData = industriesData[selectedIndustryIdx];

  const handleIndustryCTA = (name: string) => {
    try {
      saveDraft({
        companyName: "",
        productKeyword: "",
        industry: name,
        provider: "豆包",
      });
    } catch {}
    window.location.assign("/test");
  };

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

        {/* Industry Scenarios Module */}
        <section className="bg-surface relative py-32 overflow-hidden border-t border-outline-variant/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f3f4610_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4610_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-screen-2xl mx-auto px-8 relative z-10">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">五大行业，AI 会先推荐谁？</h2>
              <p className="text-xl text-on-surface-variant max-w-3xl">
                同样是在向 AI 求解，不同行业的推荐逻辑、内容偏好和品牌淘汰机制截然不同。了解您的行业风险。
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
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">{activeData.name} 行业洞察终端</h3>
                    <span className="ml-auto text-[10px] uppercase font-mono tracking-widest px-2 py-1 rounded bg-[#000000] border border-outline-variant/20 text-on-surface-variant">
                      {activeData.tag}
                    </span>
                  </div>

                  <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">search</span>
                        用户会怎么问
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-lg font-mono text-sm border border-outline-variant/20 text-on-surface-variant">
                        "{activeData.queryExample}"
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        AI 常见推荐偏向
                      </div>
                      <div className="text-sm leading-relaxed text-on-surface-variant">
                        {activeData.bias}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        您的核心风险
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
                        GiuGEO 如何切入干预
                      </div>
                      <p className="text-sm leading-relaxed mb-6 text-on-surface-variant">
                        {activeData.strategy}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20 flex flex-col gap-3">
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">close</span>
                            未做 GEO 时
                          </span>
                          <span className="text-sm text-on-surface-variant/80">{activeData.beforeGeo}</span>
                        </div>
                        <div className="bg-primary/5 p-5 rounded-lg border border-primary/20 flex flex-col gap-3">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            进入 AI 首选池后
                          </span>
                          <span className="text-sm text-on-surface-variant tracking-wide leading-relaxed">{activeData.afterGeo}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-outline-variant/20 relative z-10 w-full">
                    <button 
                      onClick={() => handleIndustryCTA(activeData.name)}
                      className="w-full py-4 rounded-xl font-bold text-[14px] tracking-widest transition-all border hover:scale-[1.01] flex justify-center items-center gap-2 bg-primary text-on-primary border-transparent hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                      免费检测我在【{activeData.name}】的 AI 曝光
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Module */}
        <section className="bg-surface-container-low relative py-32 overflow-hidden border-t border-outline-variant/20">
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
                  常见问题解答
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 text-on-surface">
                  关于评测，<br/>您想了解的
                </h2>
                <p className="text-lg text-on-surface-variant max-w-md leading-relaxed mb-8">
                  在开启您的首次生成式 AI 品牌曝光检测之前，熟悉这些机制能帮助您更好地理解诊断结果及其背后的深远影响。
                </p>
                <div className="mb-10 mt-2">
                  <Link
                    href="/test"
                    className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-300 pointer"
                  >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    现在开始我的免费检测
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
