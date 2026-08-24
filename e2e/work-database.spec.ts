import { test, expect } from "@playwright/test";

const company = {
  id: "company-test",
  name: "Acme Systems",
  jobTitle: "Automation Developer",
};

test.describe("work database", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("collage expands and persists a company and task", async ({ page }) => {
    await expect(page.getByTestId("modify-work-tasks")).toBeVisible();
    await page.locator("#work-database").screenshot({ path: "e2e/screenshots/views/work-collage-light-stacked.png" });
    await page.getByTestId("modify-work-tasks").click();
    await expect(page.getByTestId("work-task-grid")).toBeVisible();
    await page.locator("#work-database").screenshot({ path: "e2e/screenshots/views/work-collage-light-grid.png" });

    await page.getByTestId("add-company").click();
    await page.getByLabel("Company name").fill(company.name);
    await page.getByLabel("Job title").fill(company.jobTitle);
    await page.getByRole("button", { name: "Save company" }).click();

    await page.getByTestId("add-work-task").click();
    await page.getByLabel("Start month").fill("2024-10");
    await page.getByLabel("What did you accomplish?").fill("I created an automation that reduced FTE workload by 2 people.");
    await page.getByRole("button", { name: "Save task" }).click();

    await expect(page.getByText("October 2024")).toBeVisible();
    await expect(page.getByText(company.name)).toBeVisible();

    await page.reload();
    await page.getByTestId("modify-work-tasks").click();
    await expect(page.getByText(company.name)).toBeVisible();
    await expect(page.getByText("I created an automation that reduced FTE workload by 2 people.")).toBeVisible();
  });

  test("dark theme captures stacked and grid collage states", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload();
    await page.locator("#work-database").screenshot({ path: "e2e/screenshots/views/work-collage-dark-stacked.png" });
    await page.getByTestId("modify-work-tasks").click();
    await page.locator("#work-database").screenshot({ path: "e2e/screenshots/views/work-collage-dark-grid.png" });
  });

  test("uses two, three, and four carousel columns responsively", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.locator("[data-collage-column]:visible")).toHaveCount(2);
    await page.setViewportSize({ width: 800, height: 800 });
    await expect(page.locator("[data-collage-column]:visible")).toHaveCount(3);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("[data-collage-column]:visible")).toHaveCount(4);
  });

  test("reduced motion keeps the expanded grid usable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByTestId("modify-work-tasks").click();
    await expect(page.getByTestId("work-task-grid")).toBeVisible();
    await expect(page.getByTestId("collapse-work-tasks")).toBeVisible();
  });
});
