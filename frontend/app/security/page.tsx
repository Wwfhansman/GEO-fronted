"use client";

import React from "react";
import { InfoPageLayout } from "../../components/content/InfoPageLayout";
import { useLanguage } from "../../components/providers/LanguageProvider";

const pageCopy = {
  en: {
    eyebrow: "Security Center",
    title: "Security",
    description:
      "We handle accounts, test requests, and business data through a minimal-exposure, server-controlled architecture so the brand-audit workflow stays controlled, auditable, and maintainable.",
    sections: [
      {
        title: "Data scope",
        paragraphs: [
          "GiuGEO currently handles four main categories of data: registration details, test-form inputs, generated test records, and essential contact information for business follow-up. These data are used only to create accounts, generate visibility diagnostics, preserve history, and handle consultation requests.",
          "We do not expose model keys or backend credentials in the frontend. Authentication, quota checks, test execution, and result persistence all run on the server side.",
        ],
      },
      {
        title: "Account and access control",
        paragraphs: [
          "Users authenticate with email and password. The frontend relies on Supabase session state, and the backend performs a second validation of the Bearer token. Test results, history, and lead-contact endpoints are all tied to the current user identity to prevent unauthorized access.",
          "The internal dashboard is additionally protected by an admin-email allowlist, so regular users cannot access aggregated admin data directly.",
        ],
      },
      {
        title: "Transport and storage security",
        paragraphs: [
          "Production deployments should run entirely over HTTPS so browser-to-frontend and frontend-to-API traffic remain encrypted. Test requests, lead submissions, and result lookups should all travel through encrypted channels.",
          "Business data is stored in a controlled database environment, and model invocation plus result generation are orchestrated by the backend. We keep only the data required to run the product and support customers, and we do not persist sensitive service credentials in the client.",
        ],
      },
      {
        title: "Reporting security issues",
        paragraphs: [
          "If you discover an issue related to account security, access control, or data exposure, please contact your business representative or the official support channel as soon as possible. We will review, respond, and update status promptly after confirmation.",
        ],
      },
    ],
  },
  zh: {
    eyebrow: "Security Center",
    title: "安全中心",
    description:
      "我们以最小暴露面和服务端统一控制为原则处理账号、测试请求与业务数据，确保品牌检测链路可控、可审计、可持续迭代。",
    sections: [
      {
        title: "数据处理范围",
        paragraphs: [
          "GiuGEO 当前主要处理四类数据：账户注册信息、测试表单输入、测试结果记录以及必要的运营联系信息。这些数据仅用于完成账号注册、生成品牌曝光诊断结果、保存历史记录和承接销售咨询。",
          "我们不会在前端暴露任何模型密钥或后端凭据。涉及鉴权、额度判定、测试执行和结果持久化的逻辑，均在服务端完成。",
        ],
      },
      {
        title: "账号与访问控制",
        paragraphs: [
          "用户通过邮箱与密码进行身份验证，前端使用 Supabase 登录态，后端再对 Bearer Token 做二次校验。测试结果、历史记录和联系销售接口都绑定到当前用户身份，避免越权读取其他人的数据。",
          "内部管理后台采用额外的管理员邮箱白名单控制，普通用户无法直接访问后台聚合信息。",
        ],
      },
      {
        title: "传输与存储安全",
        paragraphs: [
          "线上环境建议全站启用 HTTPS，确保浏览器到前端、前端到 API 的传输链路加密。测试请求、线索提交和结果查询都应通过加密通道传输。",
          "业务数据存储在受控的数据库环境中，模型调用与结果生成由后端统一调度。我们仅保留支撑产品运行和客户服务所必需的数据，不在客户端持久化敏感服务凭据。",
        ],
      },
      {
        title: "安全问题反馈",
        paragraphs: [
          "如果您发现账户安全、接口访问控制或数据泄露相关问题，建议第一时间通过业务联系人或官方支持邮箱联系我们。我们会在确认后尽快处理并更新状态。",
        ],
      },
    ],
  },
} as const;

export default function SecurityPage() {
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
