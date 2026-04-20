import { afterEach, expect, test, vi } from "vitest";

import { trackEvent } from "../../lib/analytics";
import * as authModule from "../../lib/auth";

vi.mock("../../lib/auth", () => ({
  getAccessToken: vi.fn().mockResolvedValue(null),
  getCachedAccessToken: vi.fn().mockReturnValue(null),
}));

test("trackEvent is defined", () => {
  expect(typeof trackEvent).toBe("function");
});

test("trackEvent returns event payload", () => {
  const result = trackEvent("test_event", { page: "landing" });
  expect(result.eventName).toBe("test_event");
  expect(result.properties).toEqual({ page: "landing" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("trackEvent prefers authenticated keepalive fetch when a cached token exists", () => {
  vi.stubEnv("NODE_ENV", "production");
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);
  const sendBeaconSpy = vi.fn();
  Object.defineProperty(globalThis.navigator, "sendBeacon", {
    configurable: true,
    value: sendBeaconSpy,
  });

  vi.mocked(authModule.getCachedAccessToken).mockReturnValue("cached-token");

  trackEvent("nav_click", { source: "header" });

  expect(fetchSpy).toHaveBeenCalled();
  expect(sendBeaconSpy).not.toHaveBeenCalled();
});
