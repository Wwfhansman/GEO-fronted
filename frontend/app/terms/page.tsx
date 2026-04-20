"use client";

import React from "react";
import { InfoPageLayout } from "../../components/content/InfoPageLayout";
import { useLanguage } from "../../components/providers/LanguageProvider";

const pageCopy = {
  en: {
    eyebrow: "Terms of Service",
    title: "Terms",
    description:
      "Before using GiuGEO, please review the current service scope, result boundaries, and basic usage rules. Continued use means you understand and accept these terms.",
    sections: [
      {
        title: "Service overview",
        paragraphs: [
          "GiuGEO provides AI visibility testing, result presentation, and consultant-intake services for brands and business users. The current free audit is intended to help users quickly understand brand visibility risk in generative-AI scenarios.",
          "We may adjust free quota, page content, and service capabilities based on product stage, system load, or business strategy.",
        ],
      },
      {
        title: "Result disclaimer",
        paragraphs: [
          "Test results are provided only as business reference and risk signaling. They do not constitute a formal audit conclusion, legal opinion, investment advice, or any official certification.",
          "Model outputs are probabilistic by nature and can change with model version, context, and third-party service stability.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "You may not use this service for malicious volume abuse, automated misuse, unauthorized access, API attacks, or any action that harms system stability. We reserve the right to restrict or terminate access when abnormal usage is detected.",
          "The company information, keywords, and other materials you submit must be lawful, accurate, and non-infringing.",
        ],
      },
      {
        title: "Interruption and change",
        paragraphs: [
          "We aim to keep the service stable but do not guarantee absolute availability at every moment. Maintenance, third-party dependency failures, or force majeure may cause delay, interruption, or partial unavailability.",
          "If these terms change, the updated version displayed on this page will continue to apply.",
        ],
      },
    ],
  },
  zh: {
    eyebrow: "Terms of Service",
    title: "服务条款",
    description:
      "使用 GiuGEO 前，请先了解当前阶段服务的适用范围、结果边界与基本使用规则。继续使用即视为您理解并接受这些条款。",
    sections: [
      {
        title: "服务说明",
        paragraphs: [
          "GiuGEO 提供面向品牌与企业用户的 AI 曝光检测、结果展示与顾问咨询承接服务。当前免费测试主要用于帮助用户快速理解品牌在生成式 AI 场景中的可见性风险。",
          "我们有权根据产品阶段、系统负载或业务策略调整免费额度、页面内容和服务能力。",
        ],
      },
      {
        title: "结果免责声明",
        paragraphs: [
          "测试结果仅作为业务参考和风险提示，不构成严格审计结论、法律意见、投资建议或任何形式的官方认证结论。",
          "大模型输出本身存在概率波动，结果会受到模型版本、上下文和第三方服务稳定性的影响。",
        ],
      },
      {
        title: "用户使用规范",
        paragraphs: [
          "您不得利用本服务进行恶意刷量、批量滥用、越权访问、接口攻击或任何破坏系统稳定性的行为。若发现异常使用，我们有权限制或终止访问。",
          "您提交的公司信息、关键词和其他内容应当合法、真实，且不侵犯第三方权益。",
        ],
      },
      {
        title: "中断与变更",
        paragraphs: [
          "我们会尽量保持服务稳定，但不对任何时间点的绝对可用性作出承诺。遇到系统维护、第三方依赖异常或不可抗力时，服务可能出现延迟、中断或部分功能不可用。",
          "若条款内容发生调整，我们将通过页面更新后的版本继续展示并生效。",
        ],
      },
    ],
  },
} as const;

export default function TermsPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  return (
    <InfoPageLayout
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      updatedAt="2026-04-16"
      sections={copy.sections}
    />
  );
}
