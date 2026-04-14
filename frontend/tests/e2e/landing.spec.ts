import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero section and navigation elements", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("renders FAQ section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("FAQ")).toBeVisible();
  });

  test("renders industry section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("行业")).toBeVisible();
  });

  test("has no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
