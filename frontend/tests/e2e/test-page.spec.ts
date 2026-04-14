import { test, expect } from "@playwright/test";

test.describe("Test page", () => {
  test("renders test form with all fields", async ({ page }) => {
    await page.goto("/test");
    await expect(page.getByPlaceholder("公司名")).toBeVisible();
    await expect(page.getByPlaceholder("产品关键词")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "查看AI曝光情况" })).toBeVisible();
  });

  test("shows metrics summary section", async ({ page }) => {
    await page.goto("/test");
    await expect(page.getByText("总查询次数")).toBeVisible();
    await expect(page.getByText("剩余免费测试次数")).toBeVisible();
  });

  test("shows validation error when form is empty", async ({ page }) => {
    await page.goto("/test");
    await page.getByRole("button", { name: "查看AI曝光情况" }).click();
    await expect(page.getByText("请填写公司名和产品关键词")).toBeVisible();
  });

  test("opens registration modal for unauthenticated user with filled form", async ({ page }) => {
    await page.goto("/test");
    await page.getByPlaceholder("公司名").fill("TestCo");
    await page.getByPlaceholder("产品关键词").fill("测试产品");
    await page.getByRole("button", { name: "查看AI曝光情况" }).click();
    // Registration modal should appear (either signup or bootstrap depending on auth state)
    // Since no Supabase is configured, the user is unauthenticated
    await expect(page.getByText("完成注册后即可查看测试结果")).toBeVisible({ timeout: 5000 });
  });

  test("has no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/test");
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
