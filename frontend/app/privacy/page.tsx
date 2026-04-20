"use client";

import React from "react";
import { InfoPageLayout } from "../../components/content/InfoPageLayout";
import { useLanguage } from "../../components/providers/LanguageProvider";

const pageCopy = {
  en: {
    eyebrow: "Privacy Policy",
    title: "Privacy",
    description:
      "We process your data only to the extent necessary to provide GiuGEO services, preserve audit results, and handle business inquiries, while keeping usage boundaries explicit and explainable.",
    sections: [
      {
        title: "Information we collect",
        paragraphs: [
          "When you register for or use the service, we may collect your email address, phone number, company name, test inputs, test-result records, and essential access-behavior data. These are used mainly to create accounts, generate reports, preserve history, and arrange consultant follow-up.",
        ],
      },
      {
        title: "How information is used",
        paragraphs: [
          "We use this information to provide AI brand-visibility testing, determine available free quota, save your historical results, and allow sales or consultants to contact you after you request it.",
          "We may also analyze anonymous or aggregated usage data to improve page experience and service stability.",
        ],
      },
      {
        title: "Third-party services and sharing",
        paragraphs: [
          "To deliver the service, we may rely on infrastructure, identity, database, or model-service providers to process necessary data. We do not proactively sell your personal information for unrelated purposes.",
          "If required by law, regulation, security response, or incident handling, we may disclose relevant information within the necessary scope.",
        ],
      },
      {
        title: "Retention and your rights",
        paragraphs: [
          "We retain data for a reasonable period required to operate the product and serve customers. If you want to correct account information, delete historical data, or understand how your information is processed, please contact us through the business support channel.",
          "This page is a baseline privacy notice for the current product stage and may be updated as the product and compliance requirements evolve.",
        ],
      },
    ],
  },
  zh: {
    eyebrow: "Privacy Policy",
    title: "隐私政策",
    description:
      "我们仅在提供 GiuGEO 服务、保存检测结果与承接客户咨询所必需的范围内处理您的数据，并尽量保持用途明确、边界可解释。",
    sections: [
      {
        title: "我们收集的信息",
        paragraphs: [
          "当您注册或使用服务时，我们可能收集邮箱、手机号、公司名称、测试输入内容、测试结果记录以及必要的访问行为信息。这些信息主要用于完成账号创建、生成报告、保存历史记录和安排顾问跟进。",
        ],
      },
      {
        title: "信息的使用方式",
        paragraphs: [
          "我们使用上述信息来提供品牌 AI 曝光检测、识别可用的免费额度、保存您的历史测试结果，并在您主动申请后由销售或顾问进行联系。",
          "我们也可能基于匿名或聚合后的统计信息分析产品使用情况，用于优化页面体验与服务稳定性。",
        ],
      },
      {
        title: "第三方服务与共享",
        paragraphs: [
          "为完成服务交付，我们可能依赖基础设施、身份认证、数据库或模型服务供应商处理必要数据。我们不会为了无关用途主动出售您的个人信息。",
          "如法律法规、监管要求或安全事件处置需要，我们可能在必要范围内披露相关信息。",
        ],
      },
      {
        title: "数据保存与您的权利",
        paragraphs: [
          "我们会在支持产品运行与客户服务所需的合理期限内保存数据。若您希望更正账户信息、删除历史数据或了解个人信息处理情况，可通过业务联系渠道与我们沟通。",
          "本页面为当前产品阶段的基础隐私说明，随着产品与合规要求变化，内容可能进行更新。",
        ],
      },
    ],
  },
} as const;

export default function PrivacyPage() {
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
