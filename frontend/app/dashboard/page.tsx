"use client";

import React, { useCallback, useEffect, useState } from "react";

import { getAccessToken } from "../../lib/auth";

interface DashboardSummary {
  user_count: number;
  test_count: number;
  lead_count: number;
  mentioned_count: number;
  funnel: {
    registered: number;
    tested: number;
    contacted: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("请先登录管理员账号");
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("无权限访问，仅管理员可查看");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(`请求失败 (${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>加载中...</main>;
  }

  if (error) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <h1>GEO 管理后台</h1>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchSummary}>重试</button>
      </main>
    );
  }

  if (!summary) return null;

  const mentionRate =
    summary.test_count > 0
      ? ((summary.mentioned_count / summary.test_count) * 100).toFixed(1)
      : "0.0";

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 24 }}>
      <h1 style={{ margin: 0 }}>GEO 管理后台</h1>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="注册用户" value={summary.user_count} />
        <StatCard label="总测试数" value={summary.test_count} />
        <StatCard label="被提及次数" value={summary.mentioned_count} />
        <StatCard label="销售线索" value={summary.lead_count} />
      </section>

      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ margin: "0 0 12px 0" }}>转化漏斗</h2>
        <FunnelBar label="注册" value={summary.funnel.registered} max={summary.funnel.registered} />
        <FunnelBar label="已测试" value={summary.funnel.tested} max={summary.funnel.registered} />
        <FunnelBar label="已联系销售" value={summary.funnel.contacted} max={summary.funnel.registered} />
      </section>

      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ margin: "0 0 8px 0" }}>关键指标</h2>
        <p style={{ margin: 0 }}>品牌提及率：{mentionRate}%</p>
        <p style={{ margin: 0 }}>
          注册 → 测试转化率：
          {summary.user_count > 0
            ? ((summary.funnel.tested / summary.user_count) * 100).toFixed(1)
            : "0.0"}
          %
        </p>
        <p style={{ margin: 0 }}>
          测试 → 联系销售转化率：
          {summary.funnel.tested > 0
            ? ((summary.funnel.contacted / summary.funnel.tested) * 100).toFixed(1)
            : "0.0"}
          %
        </p>
      </section>

      <button onClick={fetchSummary} style={{ justifySelf: "start", padding: "6px 16px" }}>
        刷新数据
      </button>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #d0d0d0",
        borderRadius: 8,
        padding: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: 14, color: "#666" }}>{label}</div>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span>{label}</span>
        <span>
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 4, height: 20 }}>
        <div
          style={{
            background: "#3b82f6",
            borderRadius: 4,
            height: 20,
            width: `${pct}%`,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}
