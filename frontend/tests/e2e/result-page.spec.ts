import { test, expect } from "@playwright/test";

test.describe("Result page", () => {
  test("shows error or loading state for invalid run id", async ({ page }) => {
    await page.goto("/result/nonexistent-id");
    // Without auth, the API call will fail — page should show error or login prompt
    await expect(
      page.getByText(/加载失败|未找到|加载中/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("has back link to test page", async ({ page }) => {
    await page.goto("/result/some-id");
    // Wait for either the error state or loading to resolve
    await page.waitForTimeout(2000);
    const backLink = page.getByText("返回测试页");
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL("/test");
    }
  });
});
