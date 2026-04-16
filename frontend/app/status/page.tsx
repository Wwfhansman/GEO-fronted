import React from "react";
import { InfoPageLayout } from "../../components/content/InfoPageLayout";

const sections = [
  {
    title: "当前系统状态",
    paragraphs: [
      "当前核心服务状态为：运行正常。页面访问、用户登录、测试执行与报告查看链路可用。",
      "这是一个轻量状态页面，用于展示当前公开服务状态与近期人工检查结论，后续可扩展为自动化健康检查看板。",
    ],
  },
  {
    title: "核心组件",
    paragraphs: [
      "前端站点：正常。用于承接首页、测试页、结果页和静态信息页面访问。",
      "业务 API：正常。用于账号 bootstrap、用户上下文获取、测试执行、联系销售与后台聚合接口。",
      "模型检测链路：正常。可执行单次曝光检测并生成测试记录。",
    ],
  },
  {
    title: "近期事件",
    paragraphs: [
      "最近 7 天内未记录重大公开故障。若后续出现影响登录、测试执行或结果查询的故障，我们会在此页面同步更新事件摘要与恢复进度。",
    ],
  },
  {
    title: "说明",
    paragraphs: [
      "若您遇到页面打不开、检测长时间无结果或登录异常，请优先刷新页面并重新登录；若问题仍存在，再联系业务支持方进一步排查。",
    ],
  },
];

export default function StatusPage() {
  return (
    <InfoPageLayout
      eyebrow="Service Status"
      title="服务状态"
      description="这里展示 GiuGEO 当前公开服务的运行情况，帮助访客快速判断站点、账号链路与检测服务是否可用。"
      updatedAt="2026-04-16 12:00 CST"
      sections={sections}
    />
  );
}
