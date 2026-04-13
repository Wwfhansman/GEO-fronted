"use client";

import React, { useState } from "react";

import { bootstrapUser } from "../../lib/api";
import { signUpWithEmail } from "../../lib/auth";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "signup" | "bootstrap";
  bootstrapEmail?: string;
};

export function RegisterModal({
  open,
  onClose,
  onSuccess,
  mode = "signup",
  bootstrapEmail = "",
}: RegisterModalProps) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const phone = ((form.get("phone") as string) || "").trim();
      const companyName = ((form.get("companyName") as string) || "").trim();

      if (mode === "bootstrap") {
        const email = bootstrapEmail.trim();
        if (!email || !phone || !companyName) {
          setError("请填写邮箱、手机号和公司名");
          return;
        }

        await bootstrapUser({ email, phone, company_name: companyName });
        onSuccess?.();
        onClose();
        return;
      }

      const email = ((form.get("email") as string) || "").trim();
      const password = ((form.get("password") as string) || "").trim();

      if (!email || !password || !phone || !companyName) {
        setError("请填写所有必填项");
        return;
      }

      const { data, error: authError } = await signUpWithEmail(email, password);
      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.session) {
        setNotice("验证邮件已发送。请先完成邮箱验证并登录，之后再继续完成账号初始化。");
        return;
      }

      await bootstrapUser({ email, phone, company_name: companyName });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  }

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
      <h2 style={{ marginTop: 0 }}>
        {mode === "bootstrap" ? "补充注册信息以继续测试" : "完成注册后即可查看测试结果"}
      </h2>
      <p>
        {mode === "bootstrap"
          ? "先完成手机号和公司信息补录，再继续执行测试。"
          : "注册成功后赠送 3 次免费测试机会。"}
      </p>
      <form style={{ display: "grid", gap: 8 }} onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <>
            <input type="email" name="email" placeholder="邮箱（必填）" required />
            <input type="password" name="password" placeholder="密码（必填）" required minLength={6} />
          </>
        ) : (
          <input
            type="email"
            name="email"
            placeholder="邮箱"
            value={bootstrapEmail}
            readOnly
            aria-readonly="true"
          />
        )}
        <input type="tel" name="phone" placeholder="手机号（必填）" required />
        <input type="text" name="companyName" placeholder="公司名（必填）" required />
        {notice && <p style={{ color: "#0a6", margin: 0 }}>{notice}</p>}
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "处理中..." : mode === "bootstrap" ? "完成补录" : "注册"}
        </button>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </form>
    </section>
  );
}
