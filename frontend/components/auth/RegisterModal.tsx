"use client";

import React, { useRef, useState } from "react";

import { bootstrapUser } from "../../lib/api";
import { PendingBootstrapProfile, signInWithEmail, signUpWithEmail } from "../../lib/auth";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "signup" | "bootstrap";
  bootstrapEmail?: string;
  bootstrapPhone?: string;
  bootstrapCompany?: string;
};

export function RegisterModal({
  open,
  onClose,
  onSuccess,
  mode = "signup",
  bootstrapEmail = "",
  bootstrapPhone = "",
  bootstrapCompany = "",
}: RegisterModalProps) {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const submitLockedRef = useRef(false);

  if (!open) return null;

  function switchTab(next: "signup" | "login") {
    setTab(next);
    setError("");
    setNotice("");
  }

  function mapAuthError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("email rate limit exceeded")) {
      return "当前环境仍在触发邮箱验证发信，但这不是推荐链路。请关闭 Supabase 的邮箱确认后再试。";
    }
    if (normalized.includes("email not confirmed")) {
      return "当前项目仍要求邮箱验证。按当前产品目标，不建议开启这个限制，请先在 Supabase Auth 设置里关闭邮箱确认。";
    }
    return message;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLockedRef.current) {
      return;
    }
    submitLockedRef.current = true;
    setError("");
    setNotice("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      // ── Bootstrap mode: supplement phone + company for authenticated user ──
      if (mode === "bootstrap") {
        const email = bootstrapEmail.trim();
        const phone = ((form.get("phone") as string) || "").trim();
        const companyName = ((form.get("companyName") as string) || "").trim();
        if (!email || !phone || !companyName) {
          setError("请填写邮箱、手机号和公司名");
          return;
        }
        await bootstrapUser({ email, phone, company_name: companyName });
        try { localStorage.removeItem("geo_pending_bootstrap"); } catch { /* ignore */ }
        await onSuccess?.();
        onClose();
        return;
      }

      // ── Login tab ──
      if (tab === "login") {
        const email = ((form.get("email") as string) || "").trim();
        const password = ((form.get("password") as string) || "").trim();
        if (!email || !password) {
          setError("请填写邮箱和密码");
          return;
        }
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          setError(authError.message === "Invalid login credentials"
            ? "邮箱或密码不正确"
            : mapAuthError(authError.message));
          return;
        }
        await onSuccess?.();
        onClose();
        return;
      }

      // ── Signup tab ──
      const email = ((form.get("email") as string) || "").trim();
      const password = ((form.get("password") as string) || "").trim();
      const phone = ((form.get("phone") as string) || "").trim();
      const companyName = ((form.get("companyName") as string) || "").trim();
      if (!email || !password || !phone || !companyName) {
        setError("请填写所有必填项");
        return;
      }

      const pendingProfile: PendingBootstrapProfile = { phone, companyName };
      const { data, error: authError } = await signUpWithEmail(email, password, pendingProfile);
      if (authError) {
        setError(mapAuthError(authError.message));
        return;
      }

      if (!data.session) {
        setError("注册后没有拿到登录态。当前项目大概率仍开启了邮箱验证，请先关闭 Supabase 的 Confirm email。");
        return;
      }

      await bootstrapUser({ email, phone, company_name: companyName });
      await onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      submitLockedRef.current = false;
      setLoading(false);
    }
  }

  const isBootstrap = mode === "bootstrap";

  return (
    <section
      style={{
        border: "1px solid #d0d0d0",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        background: "#fff",
      }}
    >
      {isBootstrap ? (
        <>
          <h2 style={{ marginTop: 0 }}>补充注册信息以继续测试</h2>
          <p>先完成手机号和公司信息补录，再继续执行测试。</p>
        </>
      ) : (
        <>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
            {(["signup", "login"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                style={{
                  padding: "8px 20px",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #0066cc" : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "#0066cc" : "#666",
                }}
              >
                {t === "signup" ? "注册" : "登录"}
              </button>
            ))}
          </div>
          <p style={{ margin: "0 0 12px", color: "#444" }}>
            {tab === "signup"
              ? "注册成功后赠送 3 次免费测试机会。"
              : "使用已注册的邮箱和密码登录。"}
          </p>
        </>
      )}

      <form style={{ display: "grid", gap: 8 }} onSubmit={handleSubmit}>
        {isBootstrap ? (
          <input
            type="email"
            name="email"
            placeholder="邮箱"
            value={bootstrapEmail}
            readOnly
            aria-readonly="true"
          />
        ) : (
          <input type="email" name="email" placeholder="邮箱（必填）" required />
        )}

        {!isBootstrap && (
          <input type="password" name="password" placeholder="密码（必填）" required minLength={6} />
        )}

        {/* Phone and company only for signup / bootstrap */}
        {(isBootstrap || tab === "signup") && (
          <>
            <input
              type="tel"
              name="phone"
              placeholder="手机号（必填）"
              required
              defaultValue={isBootstrap ? bootstrapPhone : undefined}
            />
            <input
              type="text"
              name="companyName"
              placeholder="公司名（必填）"
              required
              defaultValue={isBootstrap ? bootstrapCompany : undefined}
            />
          </>
        )}

        {notice && <p style={{ color: "#0a6", margin: 0 }}>{notice}</p>}
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "处理中..."
            : isBootstrap
              ? "完成补录"
              : tab === "login"
                ? "立即登录"
                : "立即注册"}
        </button>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </form>
    </section>
  );
}
