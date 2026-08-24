import { expect, test } from "@playwright/test";

const fixture = {
  profile: { fullName: "Ada Lovelace", email: "ada@example.com", phone: "555-0100", linkedin: "linkedin.com/in/ada", github: "", location: "London", education: "BSc Mathematics", skills: "TypeScript", certifications: "" },
  companies: [{ name: "Analytical Engines", jobTitle: "Engineer", location: "London" }],
  entries: [{ companyName: "Analytical Engines", startMonth: "2022-01", endMonth: null, task: "Built a reliable data processing pipeline." }],
};

test.describe("resume builder wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/parse-resume", async route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) }));
    await page.route("**/api/tailor-resume", async route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ resume: "Ada Lovelace\nada@example.com\n\nWORK EXPERIENCE\nEngineer | Analytical Engines\nBuilt a reliable data processing pipeline." }) }));
  });

  test("start fresh completes the six-step flow and captures screenshots", async ({ page }) => {
    await page.goto("/#/");
    await page.getByRole("button", { name: /create now/i }).click();
    await expect(page.getByRole("heading", { name: /how would you like to begin/i })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-01-start.png", fullPage: true });

    await page.getByRole("button", { name: /start fresh/i }).click();
    await page.screenshot({ path: "test-results/wizard-02-profile.png", fullPage: true });
    await page.getByRole("button", { name: /continue/i }).click();
    await page.screenshot({ path: "test-results/wizard-03-work-library.png", fullPage: true });
    await page.getByRole("button", { name: /continue/i }).click();
    await page.screenshot({ path: "test-results/wizard-04-job-description.png", fullPage: true });
    await page.getByPlaceholder(/paste the job description/i).fill("Senior engineer with data pipeline experience");
    await page.getByRole("button", { name: /generate my resume/i }).click();
    await expect(page.getByText(/generating your resume/i)).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-05-generating.png", fullPage: true });
    await expect(page.getByRole("heading", { name: /your tailored resume/i })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-06-preview.png", fullPage: true });
    await page.getByRole("button", { name: /latex source/i }).click();
    await expect(page.getByText(/documentclass/)).toBeVisible();
    const latexEditor = page.getByRole("textbox", { name: /editable latex source/i });
    await expect(latexEditor).toBeVisible();
    await latexEditor.fill("\\documentclass{article}\n% edited by candidate");
    await expect(latexEditor).toHaveValue(/edited by candidate/);
    await page.screenshot({ path: "test-results/wizard-07-latex.png", fullPage: true });
  });

  test("upload path parses and prefills profile and work history", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /create now/i }).click();
    await page.getByPlaceholder(/or paste resume text/i).fill("Ada Lovelace ada@example.com");
    await page.getByRole("button", { name: /use this resume/i }).click();
    await expect(page.getByRole("heading", { name: /how would you like to begin/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Full name" })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-upload-profile.png", fullPage: true });
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByPlaceholder("Company")).toBeVisible();
    await expect(page.locator('textarea').filter({ hasValue: /Built a reliable/ })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-upload-work.png", fullPage: true });
  });
});
