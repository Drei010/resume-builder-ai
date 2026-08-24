import { test, expect } from "@playwright/test";

// baseURL is http://localhost:8080/resume-builder-ai
// Playwright appends the path to baseURL, so "/" → /resume-builder-ai/
// We navigate to the sub-path within that base.

const STEPS = [
  { name: "0-start",       path: "/",       screenshot: "wizard-step0-start.png",   after: [] },
  { name: "1-profile",     path: "/",       screenshot: "wizard-step1-profile.png", after: ["start-fresh"] },
  { name: "2-work-library",path: "/",       screenshot: "wizard-step2-work.png",    after: ["start-fresh", "continue"] },
  { name: "3-jd",          path: "/",       screenshot: "wizard-step3-jd.png",      after: ["start-fresh", "continue", "continue"] },
];

async function advance(page: import("@playwright/test").Page, labels: string[]) {
  for (const label of labels) {
    if (label === "start-fresh") {
      await expect(page.getByTestId("start-fresh")).toBeVisible({ timeout: 5000 });
      await page.getByTestId("start-fresh").click();
    } else {
      await expect(page.getByTestId("step-continue")).toBeVisible({ timeout: 5000 });
      await page.getByTestId("step-continue").click();
    }
  }
}

test.describe("wizard audit screenshots", () => {
  for (const step of STEPS) {
    test(step.name, async ({ page }) => {
      await page.goto("/resume-builder-ai/create");
      await page.waitForLoadState("networkidle");
      await advance(page, step.after);
      await page.screenshot({ path: `e2e/screenshots/views/${step.screenshot}`, fullPage: true });
    });
  }

  test("step-4-generating", async ({ page }) => {
    await page.route("**/api/tailor-resume", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ resume: "WORK EXPERIENCE\nFull Stack Developer | Acme Corp\nJanuary 2024 – Present\nBuilt automation saving 2 FTEs." }),
      })
    );
    await page.goto("/resume-builder-ai/create");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("start-fresh").click();
    await page.getByTestId("step-continue").click();
    await page.getByTestId("step-continue").click();
    await page.getByTestId("jd-textarea").fill("Senior engineer who builds automation.");
    await page.getByTestId("step-continue").click();
    await page.screenshot({ path: "e2e/screenshots/views/wizard-step4-generating.png", fullPage: true });
  });

  test("step-5-preview", async ({ page }) => {
    await page.route("**/api/tailor-resume", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ resume: "WORK EXPERIENCE\nFull Stack Developer | Acme Corp\nJanuary 2024 – Present\nBuilt automation saving 2 FTEs." }),
      })
    );
    await page.goto("/resume-builder-ai/create");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("start-fresh").click();
    await page.getByTestId("step-continue").click();
    await page.getByTestId("step-continue").click();
    await page.getByTestId("jd-textarea").fill("Senior engineer who builds automation.");
    await page.getByTestId("step-continue").click();
    await expect(page.getByTestId("step-preview")).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: "e2e/screenshots/views/wizard-step5-preview.png", fullPage: true });
  });
});
