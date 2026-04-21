"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/auth";
import { useLanguage } from "../../../components/providers/LanguageProvider";

type BootstrapDraft = {
  email?: string;
  phone?: string;
  companyName?: string;
};

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
      if (!code) {
        setTimeout(() => router.replace("/test"), 500);
        return;
      }

      const sb = getSupabaseClient();
      if (!sb) {
        setMessage(
          language === "zh"
            ? "客户端配置缺失，请联系管理员。"
            : "Client configuration is missing. Please contact support."
        );
        return;
      }

      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(
          language === "zh"
            ? `验证失败：${error.message}`
            : `Verification failed: ${error.message}`
        );
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
