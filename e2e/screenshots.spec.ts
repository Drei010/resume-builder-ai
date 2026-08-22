import { test, expect } from "@playwright/test";

test.describe("resume builder screenshots", () => {
  test("empty state - light theme", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#root").waitFor({ state: "visible" });
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({
      path: "e2e/screenshots/views/empty-state-light.png",
      fullPage: true,
    });
  });

  test("dark theme toggle", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#root").waitFor({ state: "visible" });
    const themeToggle = page.getByTestId("theme-toggle");
    await themeToggle.click();
    // wait for the theme transition to settle before capturing
    await page.waitForTimeout(400);
    await page.screenshot({
      path: "e2e/screenshots/views/empty-state-dark.png",
      fullPage: true,
    });
  });

  test("generate resume flow", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#root").waitFor({ state: "visible" });

    await page
      .getByPlaceholder(/Paste or type your job details here/i)
      .fill(
        "I administered 16 repositories in GitHub. I supported 3 applications providing technical assistance to end users."
      );

    await page.getByRole("button", { name: /Generate Resume/i }).click();

    // wait for the resume preview textarea to appear with real content,
    // not just the loading spinner's side effect
    const previewTextarea = page.locator("textarea").nth(1);
    await expect(previewTextarea).toBeVisible({ timeout: 30_000 });
    await expect(previewTextarea).not.toHaveValue("");

    await page.screenshot({
      path: "e2e/screenshots/views/generated-resume.png",
      fullPage: true,
    });
  });
});
