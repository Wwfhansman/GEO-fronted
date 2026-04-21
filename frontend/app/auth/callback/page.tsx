"use client";

import React from "react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/auth";
import { useLanguage } from "../../../components/providers/LanguageProvider";

type BootstrapDraft = {
  email?: string;
  phone?: string;
  companyName?: string;
};

function readHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [message, setMessage] = useState(
    language === "zh" ? "正在验证身份，请稍候..." : "Verifying your account..."
  );

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const hashParams = readHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashError = hashParams.get("error");
      const hashErrorCode = hashParams.get("error_code");
      const hashErrorDescription = hashParams.get("error_description");

      const sb = getSupabaseClient();
      if (!sb) {
        setMessage(
          language === "zh"
            ? "客户端配置缺失，请联系管理员。"
            : "Client configuration is missing. Please contact support."
        );
        return;
      }

      if (hashError) {
        const decodedDescription = hashErrorDescription ?? "";
        const expired = hashErrorCode === "otp_expired";
        setMessage(
          expired
            ? (language === "zh"
                ? "邮箱验证链接已失效，请重新注册或重新发送验证邮件。"
                : "This verification link has expired. Please sign up again or request a new verification email.")
            : (language === "zh"
                ? `验证失败：${decodedDescription || hashError}`
                : `Verification failed: ${decodedDescription || hashError}`)
        );
        return;
      }

      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(
            language === "zh"
              ? `验证失败：${error.message}`
              : `Verification failed: ${error.message}`
          );
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await sb.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setMessage(
            language === "zh"
              ? `验证失败：${error.message}`
              : `Verification failed: ${error.message}`
          );
          return;
        }
      } else {
        setTimeout(() => router.replace("/test"), 500);
        return;
      }

      const { data: { session } } = await sb.auth.getSession();
      const sessionUser = session?.user;

      try {
        const raw = localStorage.getItem("geo_pending_bootstrap");
        const localDraft: BootstrapDraft | null = raw ? JSON.parse(raw) as BootstrapDraft : null;
        const metadata = (sessionUser?.user_metadata ?? {}) as BootstrapDraft;
        const email = sessionUser?.email || localDraft?.email || "";
        const phone = (typeof metadata.phone === "string" && metadata.phone.trim())
          ? metadata.phone.trim()
          : (localDraft?.phone || "").trim();
        const companyName = (typeof metadata.companyName === "string" && metadata.companyName.trim())
          ? metadata.companyName.trim()
          : (localDraft?.companyName || "").trim();

        if (email && phone && companyName) {
          localStorage.setItem("geo_pending_bootstrap", JSON.stringify({ email, phone, companyName }));
        }
      } catch {
        setMessage(
          language === "zh"
            ? "邮箱已验证，但未能恢复补注册信息。请返回测试页补充手机号和公司信息。"
            : "Your email was verified, but we could not restore your profile draft. Please return to the test page and complete registration."
        );
        return;
      }

      router.replace("/test?complete_registration=1");
    }

    handleCallback();
  }, [language, router, searchParams]);

  return <p>{message}</p>;
}

export default function AuthCallbackPage() {
  return (
    <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
      <Suspense fallback={<p>Loading...</p>}>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
