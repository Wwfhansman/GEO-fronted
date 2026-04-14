import { test, expect } from "@playwright/test";

test.describe("Dashboard page", () => {
  test("shows login or permission error without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByText(/登录|无权限|请求失败/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("has no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
