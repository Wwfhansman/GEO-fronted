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
      const payload = JSON.stringify({
        event: eventName,
        properties,
        visitor_id: getVisitorId(),
        timestamp: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          endpoint,
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        void fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // Silently ignore analytics failures
    }
  }

  return { eventName, properties };
}
