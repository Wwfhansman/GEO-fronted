import { getAccessToken, getCachedAccessToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const VISITOR_KEY = "geo-visitor-id";

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) {
      return existing;
    }

    const created = createVisitorId();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): { eventName: string; properties: Record<string, unknown> } {
  if (typeof window !== "undefined") {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      return { eventName, properties };
    }
    try {
      const endpoint = `${API_BASE}/api/analytics/track`;
      const payload = {
        event: eventName,
        properties,
        visitor_id: getVisitorId(),
        timestamp: new Date().toISOString(),
      };
      const serialized = JSON.stringify(payload);
      const cachedToken = getCachedAccessToken();

      // Prefer an authenticated keepalive fetch when a token is already available in memory.
      if (cachedToken) {
        void fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cachedToken}`,
          },
          body: serialized,
          keepalive: true,
        }).catch(() => undefined);
        return { eventName, properties };
      }

      // Preserve the synchronous beacon path when we cannot synchronously attach auth.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          endpoint,
          new Blob([serialized], { type: "application/json" }),
        );
        return { eventName, properties };
      }

      void (async () => {
        const token = await getAccessToken().catch(() => null);
        if (token) {
          await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: serialized,
            keepalive: true,
          }).catch(() => undefined);
          return;
        }

        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: serialized,
          keepalive: true,
        }).catch(() => undefined);
      })();
    } catch {
      // Silently ignore analytics failures
    }
  }

  return { eventName, properties };
}
