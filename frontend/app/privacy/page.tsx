import React from "react";
import { InfoPageLayout } from "../../components/content/InfoPageLayout";

const sections = [
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
];

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Privacy Policy"
      title="隐私政策"
      description="我们仅在提供 GiuGEO 服务、保存检测结果与承接客户咨询所必需的范围内处理您的数据，并尽量保持用途明确、边界可解释。"
      updatedAt="2026-04-16"
      sections={sections}
    />
  );
}
