import { expect, test } from "vitest";

import { trackEvent } from "../../lib/analytics";

test("trackEvent is defined", () => {
  expect(typeof trackEvent).toBe("function");
});

test("trackEvent returns event payload", () => {
  const result = trackEvent("test_event", { page: "landing" });
  expect(result.eventName).toBe("test_event");
  expect(result.properties).toEqual({ page: "landing" });
});
