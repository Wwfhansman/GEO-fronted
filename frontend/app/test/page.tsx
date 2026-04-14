"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { RegisterModal } from "../../components/auth/RegisterModal";
import {
  executeTest,
  getUserContext,
  listTestRuns,
  submitContactLead,
  UserContext,
  ExecuteTestResponse,
  ExecuteTestRequest,
  TestRunSummary,
} from "../../lib/api";
import { getAccessToken, getCurrentUserEmail, signOut } from "../../lib/auth";
import { loadDraft, saveDraft } from "../../lib/draft";

export default function TestPage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<"signup" | "bootstrap">("signup");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPhone, setBootstrapPhone] = useState("");
  const [bootstrapCompany, setBootstrapCompany] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<ExecuteTestResponse | null>(null);
  const [pendingRequest, setPendingRequest] = useState<ExecuteTestRequest | null>(null);
  const [history, setHistory] = useState<TestRunSummary[]>([]);
  const pendingRequestRef = useRef<ExecuteTestRequest | null>(null);
  const executeInFlightRef = useRef(false);
  const bootstrapInFlightRef = useRef(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [industry, setIndustry] = useState("医疗健康");
  const [provider, setProvider] = useState("ChatGPT");

  const refreshContext = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setContext(null);
        return;
      }
      setIsAuthenticated(true);
      const email = await getCurrentUserEmail();
      setCurrentEmail(email || "");
      const ctx = await getUserContext();
      setContext(ctx);
      if (ctx.is_registered) {
        try {
          const runs = await listTestRuns();
          setHistory(runs);
        } catch {
          // History fetch failure should not break the main flow
        }
      }
    } catch {
      setIsAuthenticated(false);
      setContext(null);
      setCurrentEmail("");
    }
  }, []);

  const executeRequest = useCallback(
    async (request: ExecuteTestRequest) => {
      if (executeInFlightRef.current) {
        return;
      }
      executeInFlightRef.current = true;
      setError("");
      setLoading(true);
      try {
        const result = await executeTest(request);
        setLastResult(result);
        await refreshContext();
      } catch (err) {
        setError(err instanceof Error ? err.message : "测试执行失败");
      } finally {
        executeInFlightRef.current = false;
        setLoading(false);
      }
    },
    [refreshContext]
  );

  const handleBootstrapSuccess = useCallback(async () => {
    if (bootstrapInFlightRef.current) {
      return;
    }
    bootstrapInFlightRef.current = true;
    const request = pendingRequestRef.current;
    pendingRequestRef.current = null;
    setPendingRequest(null);
    setRegisterOpen(false);
    try {
      await refreshContext();
      if (request) {
        await executeRequest(request);
      }
    } finally {
      bootstrapInFlightRef.current = false;
    }
  }, [executeRequest, refreshContext]);

  // Load draft and check auth on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setCompanyName(draft.companyName);
      setProductKeyword(draft.productKeyword);
      setIndustry(draft.industry);
      setProvider(draft.provider);
    }
    refreshContext();
  }, [refreshContext]);

  // Save draft on form changes
  useEffect(() => {
    saveDraft({ companyName, productKeyword, industry, provider });
  }, [companyName, productKeyword, industry, provider]);

  const freeQuotaRemaining = context?.free_test_quota_remaining ?? 3;
  const showContactSales = isAuthenticated && context?.is_registered && freeQuotaRemaining <= 0;

  async function handleExecuteTest() {
    if (!companyName.trim() || !productKeyword.trim()) {
      setError("请填写公司名和产品关键词");
      return;
    }

    const request = {
      company_name: companyName,
      product_keyword: productKeyword,
      industry,
      provider,
    };

    if (!isAuthenticated) {
      setRegisterMode("signup");
      setRegisterOpen(true);
      return;
    }

    if (context === null) {
      setError("正在加载账号状态，请稍后重试");
      return;
    }

    if (!context.is_registered) {
      setError("");
      pendingRequestRef.current = request;
      setPendingRequest(request);
      setRegisterMode("bootstrap");
      const email = await getCurrentUserEmail() || "";
      setBootstrapEmail(email);

      // Pre-fill phone/company from pending bootstrap data saved before email verification
      try {
        const raw = localStorage.getItem("geo_pending_bootstrap");
        if (raw) {
          const pending = JSON.parse(raw) as { phone?: string; companyName?: string };
          setBootstrapPhone(pending.phone || "");
          setBootstrapCompany(pending.companyName || "");
        }
      } catch { /* ignore */ }

      setRegisterOpen(true);
      return;
    }

    await executeRequest(request);
  }

  async function handleSignOut() {
    await signOut();
    setIsAuthenticated(false);
    setContext(null);
    setCurrentEmail("");
    setHistory([]);
  }

  async function handleContactSales() {
    setError("");
    try {
      await submitContactLead({
        test_run_id: lastResult?.test_run_id,
        test_summary: { total_query_count: context?.total_query_count },
      });
      alert("提交成功，我们的销售团队将尽快联系您！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      {/* Auth status bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, fontSize: 14 }}>
        {isAuthenticated ? (
          <>
            <span style={{ color: "#666" }}>{currentEmail}</span>
            <button
              type="button"
              onClick={handleSignOut}
              style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d0d0d0", cursor: "pointer", background: "#fff" }}
            >
              退出登录
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { setRegisterMode("signup"); setRegisterOpen(true); }}
            style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #0066cc", cursor: "pointer", background: "#fff", color: "#0066cc" }}
          >
            登录 / 注册
          </button>
        )}
      </div>

      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>测试页</h1>
        <p style={{ margin: 0 }}>总查询次数：{context?.total_query_count ?? 0}</p>
        <p style={{ margin: 0 }}>被提及次数：{context?.total_mentioned_count ?? 0}</p>
        <p style={{ margin: 0 }}>曝光次数：{context?.total_exposure_count ?? 0}</p>
        <p style={{ margin: 0 }}>剩余免费测试次数：{freeQuotaRemaining}</p>
        {context?.overall_evaluation_text && (
          <p style={{ margin: 0, color: "#666" }}>{context.overall_evaluation_text}</p>
        )}
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <input
          type="text"
          placeholder="公司名"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <input
          type="text"
          placeholder="产品关键词"
          value={productKeyword}
          onChange={(e) => setProductKeyword(e.target.value)}
        />
        <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option>医疗健康</option>
          <option>电商品牌</option>
          <option>IT科技</option>
          <option>智能制造</option>
          <option>传统零售</option>
        </select>
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option>ChatGPT</option>
          <option>DeepSeek</option>
          <option>豆包</option>
          <option>通义</option>
        </select>

        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

        {!showContactSales ? (
          <button type="button" onClick={handleExecuteTest} disabled={loading}>
            {loading ? "测试中..." : "查看AI曝光情况"}
          </button>
        ) : (
          <button type="button" onClick={handleContactSales}>
            联系销售获取更多测试机会
          </button>
        )}
      </section>

      <section>
        <h2>最近一次测试结果</h2>
        {lastResult ? (
          <div
            style={{
              border: "1px solid #d0d0d0",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 4,
            }}
          >
            <p style={{ margin: 0 }}>
              状态：{lastResult.status === "completed" ? "已完成" : lastResult.status}
            </p>
            <p style={{ margin: 0 }}>
              是否被提及：{lastResult.is_mentioned ? "是" : "否"}
            </p>
            <p style={{ margin: 0 }}>提及次数：{lastResult.mentioned_count_for_query}</p>
            <p style={{ margin: 0 }}>曝光次数：{lastResult.exposure_count_for_query}</p>
            <p style={{ margin: 0 }}>匹配来源：{lastResult.final_match_source}</p>
            <p style={{ margin: 0 }}>{lastResult.evaluation_text}</p>
            <a href={`/result/${lastResult.test_run_id}`} style={{ color: "#0066cc" }}>
              查看详细结果 →
            </a>
          </div>
        ) : (
          <p>暂无测试结果</p>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2>测试历史</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {history.map((run) => (
              <a
                key={run.id}
                href={`/result/${run.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 12px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span>
                  {run.input_company_name} · {run.input_industry} · {run.input_provider}
                </span>
                <span
                  style={{
                    color: run.is_mentioned ? "#16a34a" : "#dc2626",
                    fontWeight: "bold",
                  }}
                >
                  {run.is_mentioned ? "已提及" : "未提及"}
                </span>
                <span style={{ color: "#999", fontSize: 12 }}>
                  {new Date(run.created_at).toLocaleString("zh-CN")}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <RegisterModal
        open={registerOpen}
        mode={registerMode}
        bootstrapEmail={bootstrapEmail}
        bootstrapPhone={bootstrapPhone}
        bootstrapCompany={bootstrapCompany}
        onClose={() => setRegisterOpen(false)}
        onSuccess={registerMode === "bootstrap" ? handleBootstrapSuccess : refreshContext}
      />
    </main>
  );
}
