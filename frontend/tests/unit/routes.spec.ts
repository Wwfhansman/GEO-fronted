import { describe, expect, it } from "vitest";

describe("route placeholders", () => {
  it("defines route files", async () => {
    const routes = [
      () => import("../../app/page"),
      () => import("../../app/test/page"),
      () => import("../../app/result/[id]/page"),
      () => import("../../app/dashboard/page"),
    ];
    await Promise.all(routes.map((loader) => loader()));
    expect(true).toBe(true);
  });
});
