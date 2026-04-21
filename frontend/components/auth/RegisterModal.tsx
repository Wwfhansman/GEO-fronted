"use client";

import React, { useEffect, useRef, useState } from "react";

import { bootstrapUser } from "../../lib/api";
import { PendingBootstrapProfile, signInWithEmail, signUpWithEmail } from "../../lib/auth";
import { useLanguage } from "../providers/LanguageProvider";
import { TurnstileWidget } from "./TurnstileWidget";

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
  const { language } = useLanguage();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const submitLockedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setTurnstileToken(null);
    }
  }, [mode, open, tab]);

  if (!open) return null;

  function switchTab(next: "signup" | "login") {
    setTab(next);
    setError("");
    setNotice("");
    setTurnstileToken(null);
  }

  function mapAuthError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("email rate limit exceeded")) {
      return language === "zh"
        ? "当前邮箱发送过于频繁，请稍后再试。"
        : "Too many verification emails were requested. Please try again later.";
    }
    if (normalized.includes("email not confirmed")) {
      return language === "zh"
        ? "请先完成邮箱验证后再登录。"
        : "Please verify your email before signing in.";
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
      if (mode === "bootstrap") {
        const email = bootstrapEmail.trim();
        const phone = ((form.get("phone") as string) || "").trim();
        const companyName = ((form.get("companyName") as string) || "").trim();
        if (!email || !phone || !companyName) {
          setError(language === "zh" ? "请填写邮箱、手机号和公司名" : "Please complete email, phone, and company name.");
          return;
        }
        if (requiresTurnstile && !turnstileToken) {
          setError(language === "zh" ? "请先完成人机验证" : "Please complete the verification challenge first.");
          return;
        }
        await bootstrapUser({ email, phone, company_name: companyName, turnstile_token: turnstileToken ?? undefined });
        try { localStorage.removeItem("geo_pending_bootstrap"); } catch { /* ignore */ }
        await onSuccess?.();
        onClose();
        return;
      }

      if (tab === "login") {
        const email = ((form.get("email") as string) || "").trim();
        const password = ((form.get("password") as string) || "").trim();
        if (!email || !password) {
          setError(language === "zh" ? "请填写邮箱和密码" : "Please enter both email and password.");
          return;
        }
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          setError(authError.message === "Invalid login credentials"
            ? (language === "zh" ? "邮箱或密码不正确" : "Incorrect email or password.")
            : mapAuthError(authError.message));
          return;
        }
        await onSuccess?.();
        onClose();
        return;
      }

      const email = ((form.get("email") as string) || "").trim();
      const password = ((form.get("password") as string) || "").trim();
      const phone = ((form.get("phone") as string) || "").trim();
      const companyName = ((form.get("companyName") as string) || "").trim();
      if (!email || !password || !phone || !companyName) {
        setError(language === "zh" ? "请填写所有必填项" : "Please complete all required fields.");
        return;
      }
      if (requiresTurnstile && !turnstileToken) {
        setError(language === "zh" ? "请先完成人机验证" : "Please complete the verification challenge first.");
        return;
      }

      const pendingProfile: PendingBootstrapProfile = { phone, companyName };
      try {
        localStorage.setItem("geo_pending_bootstrap", JSON.stringify({
          email,
          phone,
          companyName,
        }));
      } catch {
        // ignore storage failures
      }
      const { data, error: authError } = await signUpWithEmail(email, password, pendingProfile);
      if (authError) {
        setError(mapAuthError(authError.message));
        return;
      }

      if (!data.session) {
        setNotice(
          language === "zh"
            ? "注册成功。请前往邮箱完成验证，验证后会自动返回并继续完成注册。"
            : "Account created. Please verify your email to continue. After confirmation, you will be redirected back automatically.",
        );
        return;
      }

      await bootstrapUser({ email, phone, company_name: companyName, turnstile_token: turnstileToken ?? undefined });
      await onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === "zh" ? "操作失败，请重试" : "Action failed. Please try again."));
    } finally {
      submitLockedRef.current = false;
      setLoading(false);
    }
  }

  const isBootstrap = mode === "bootstrap";
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const requiresTurnstile = turnstileEnabled && (isBootstrap || tab === "signup");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden shadow-black">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface-container-highest/20">
          <div>
            <h2 className="text-xl font-bold font-headline">
              {isBootstrap ? (language === "zh" ? "补充注册信息" : "Complete registration details") : (language === "zh" ? "账户登录与注册" : "Log in or create account")}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {isBootstrap
                ? (language === "zh" ? "完成手机号和公司信息补录，继续检测" : "Add phone and company details to continue the audit")
                : (language === "zh" ? "加入 GiuGEO 体验完整智库分析" : "Join GiuGEO for the full intelligence workflow")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          {!isBootstrap && (
            <div className="flex mb-6 border-b border-outline-variant/30">
              {(["signup", "login"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${tab === t
                      ? "text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  {t === "signup" ? (language === "zh" ? "注册新账号" : "Create account") : (language === "zh" ? "密码登录" : "Password login")}
                </button>
              ))}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isBootstrap ? (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{language === "zh" ? "邮箱" : "Email"}</label>
                <input
                  type="email"
                  name="email"
                  value={bootstrapEmail}
                  readOnly
                  aria-readonly="true"
                  className="w-full bg-surface-container-highest border border-outline-variant/50 rounded-lg p-3 text-on-surface opacity-60 cursor-not-allowed"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{language === "zh" ? "邮箱" : "Email"}</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-3 text-on-surface transition-colors"
                />
              </div>
            )}

            {!isBootstrap && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{language === "zh" ? "密码" : "Password"}</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-3 text-on-surface transition-colors"
                />
              </div>
            )}

            {(isBootstrap || tab === "signup") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{language === "zh" ? "手机号" : "Phone"}</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={isBootstrap ? bootstrapPhone : undefined}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-3 text-on-surface transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{language === "zh" ? "公司名" : "Company"}</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    defaultValue={isBootstrap ? bootstrapCompany : undefined}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-3 text-on-surface transition-colors"
                  />
                </div>
              </div>
            )}

            {notice && <div className="text-green-400 text-sm mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">info</span>{notice}</div>}
            {error && <div className="text-red-400 text-sm mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{error}</div>}

            {requiresTurnstile ? (
              <div className="pt-2">
                <TurnstileWidget onTokenChange={setTurnstileToken} />
              </div>
            ) : null}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:bg-white hover:scale-[1.02] transition-all flex justify-center items-center gap-2 outline-none disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                {loading && <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>}
                {loading
                  ? (language === "zh" ? "处理中..." : "Processing...")
                  : isBootstrap
                    ? (language === "zh" ? "完成补录" : "Finish setup")
                    : tab === "login"
                      ? (language === "zh" ? "立即登录" : "Log in")
                      : (language === "zh" ? "立即注册" : "Create account")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
