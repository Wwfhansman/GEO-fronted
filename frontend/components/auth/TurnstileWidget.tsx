"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove?: (widgetId: string) => void;
      reset?: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
};

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile_load_failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ onTokenChange }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      onTokenChange(null);
      return;
    }

    let active = true;
    void loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token: string) => onTokenChange(token),
          "expired-callback": () => onTokenChange(null),
          "error-callback": () => {
            onTokenChange(null);
            setLoadError(true);
          },
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setLoadError(true);
        onTokenChange(null);
      });

    return () => {
      active = false;
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
      widgetIdRef.current = null;
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="min-h-[66px] rounded-lg border border-outline-variant/30 bg-surface-container-highest/20 flex items-center justify-center overflow-hidden"
      />
      {loadError ? (
        <p className="text-xs text-red-400">
          Unable to load the verification challenge. Please refresh and try again.
        </p>
      ) : null}
    </div>
  );
}
