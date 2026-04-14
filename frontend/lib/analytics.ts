const WRITE_KEY = process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY || "";

export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): { eventName: string; properties: Record<string, unknown> } {
  if (WRITE_KEY && typeof window !== "undefined") {
    // Fire-and-forget beacon to analytics endpoint if configured
    try {
      const payload = JSON.stringify({
        writeKey: WRITE_KEY,
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/analytics/track`,
          new Blob([payload], { type: "application/json" }),
        );
      }
    } catch {
      // Silently ignore analytics failures
    }
  }
  return { eventName, properties };
}
