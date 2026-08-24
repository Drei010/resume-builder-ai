import { test } from "@playwright/test";

const views = [
  { name: "desktop", viewport: { width: 1280, height: 900 } },
  { name: "mobile",  viewport: { width: 390,  height: 844 } },
];

test.describe("audit screenshots", () => {
  for (const { name, viewport } of views) {
    test(`light – ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `e2e/screenshots/views/audit-${name}-light.png`, fullPage: true });
    });

    test(`dark – ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("theme", "dark"));
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `e2e/screenshots/views/audit-${name}-dark.png`, fullPage: true });
    });
  }
});
