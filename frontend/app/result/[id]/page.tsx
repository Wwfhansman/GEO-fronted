"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getTestRun, submitContactLead, TestRunDetail } from "../../../lib/api";

export default function ResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [run, setRun] = useState<TestRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTestRun(id)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleContactSales() {
    try {
      await submitContactLead({
        test_run_id: id,
        test_summary: { is_mentioned: run?.is_mentioned },
      });
      setContactSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    }
  }

  if (loading) {
    return <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>加载中...</main>;
  }

  if (error || !run) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <p style={{ color: "red" }}>{error || "未找到测试结果"}</p>
        <a href="/test">← 返回测试页</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <a href="/test" style={{ color: "#0066cc" }}>← 返回测试页</a>

      <h1 style={{ margin: 0 }}>测试结果详情</h1>

      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>输入信息</h2>
        <p style={{ margin: 0 }}>公司名：{run.input_company_name}</p>
        <p style={{ margin: 0 }}>产品关键词：{run.input_product_keyword}</p>
        <p style={{ margin: 0 }}>行业：{run.input_industry}</p>
        <p style={{ margin: 0 }}>AI 模型：{run.input_provider}</p>
      </section>

      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>检测结果</h2>
        <p style={{ margin: 0 }}>
          状态：
          <strong style={{ color: run.status === "completed" ? "#16a34a" : "#dc2626" }}>
            {run.status === "completed" ? "已完成" : run.status}
          </strong>
        </p>
        <p style={{ margin: 0 }}>
          是否被 AI 提及：
          <strong style={{ color: run.is_mentioned ? "#16a34a" : "#dc2626" }}>
            {run.is_mentioned ? "是" : "否"}
          </strong>
        </p>
        <p style={{ margin: 0 }}>提及次数：{run.mentioned_count_for_query ?? 0}</p>
        <p style={{ margin: 0 }}>曝光次数：{run.exposure_count_for_query ?? 0}</p>
        <p style={{ margin: 0 }}>匹配来源：{run.final_match_source ?? "-"}</p>
      </section>

      {run.evaluation_text && (
        <section
          style={{
            border: "1px solid #d0d0d0",
            borderRadius: 12,
            padding: 16,
            background: "#f9fafb",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0" }}>AI 评估</h2>
          <p style={{ margin: 0 }}>{run.evaluation_text}</p>
        </section>
      )}

      {run.raw_response_text && (
        <section
          style={{
            border: "1px solid #d0d0d0",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ margin: "0 0 8px 0" }}>AI 原始回答</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{run.raw_response_text}</p>
        </section>
      )}

      <section
        style={{
          border: "1px solid #0066cc",
          borderRadius: 12,
          padding: 16,
          background: "#eff6ff",
          display: "grid",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>想要提升您的 AI 曝光率？</h2>
        <p style={{ margin: 0 }}>联系我们的 GEO 优化顾问，获取定制化的 AI 可见性提升方案。</p>
        {contactSubmitted ? (
          <p style={{ margin: 0, color: "#16a34a", fontWeight: "bold" }}>
            已提交，我们的团队将尽快联系您！
          </p>
        ) : (
          <button
            type="button"
            onClick={handleContactSales}
            style={{
              padding: "8px 16px",
              background: "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            联系销售顾问
          </button>
        )}
      </section>
    </main>
  );
}
