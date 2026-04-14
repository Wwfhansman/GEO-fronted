"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/auth";

type BootstrapDraft = {
  email?: string;
  phone?: string;
  companyName?: string;
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("正在验证身份，请稍候...");

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      if (!code) {
        // No code — may be implicit flow with hash token; Supabase JS picks that up automatically.
        // Give it a moment then redirect.
        setTimeout(() => router.replace("/test"), 500);
        return;
      }

      const sb = getSupabaseClient();
      if (!sb) {
        setMessage("客户端配置缺失，请联系管理员。");
        return;
      }

      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(`验证失败：${error.message}`);
        return;
      }

      const {
        data: { session },
      } = await sb.auth.getSession();
      const sessionUser = session?.user;

      // Auto-bootstrap after verification. Prefer session metadata, then fall back to local draft.
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
          const { bootstrapUser } = await import("../../../lib/api");
          await bootstrapUser({ email, phone, company_name: companyName });
        }
        localStorage.removeItem("geo_pending_bootstrap");
      } catch {
        setMessage("邮箱已验证，但自动完成注册失败。请返回测试页补充手机号和公司信息。");
        return;
      }

      router.replace("/test");
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
      <p>{message}</p>
    </main>
  );
}
