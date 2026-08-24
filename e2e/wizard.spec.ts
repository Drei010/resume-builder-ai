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
    await page.getByRole("textbox", { name: "Job description" }).fill("Senior engineer with data pipeline experience");
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

  test("reduced motion keeps landing and wizard content available", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /transform your experience/i })).toBeVisible();
    await page.getByRole("button", { name: /create now/i }).click();
    await expect(page.getByRole("heading", { name: /how would you like to begin/i })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-reduced-motion.png", fullPage: true });
  });

  test("saved resume can be selected from the start step", async ({ page }) => {
    const savedText = "Ada Lovelace\\nada@example.com\\n\\nWORK EXPERIENCE\\nBuilt an analytical engine.";
    await page.goto("/");
    await page.evaluate((text) => localStorage.setItem("savedResumes", JSON.stringify([{ id: "saved-test", title: "Analytics resume", text, createdAt: "2025-01-01T00:00:00.000Z" }])), savedText);
    await page.reload();
    await page.getByRole("button", { name: /create now/i }).click();
    await expect(page.getByTestId("saved-resume-option")).toBeVisible();
    await page.getByRole("button", { name: /open saved resume/i }).click();
    await expect(page.getByRole("heading", { name: /your tailored resume/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /resume preview/i })).toHaveValue(savedText);
  });

  test("upload path parses and prefills profile and work history", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /create now/i }).click();
    await page.getByRole("textbox", { name: "Resume text" }).fill("Ada Lovelace ada@example.com");
    await page.getByRole("button", { name: /use this resume/i }).click();
    await expect(page.getByRole("heading", { name: /how would you like to begin/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Full name" })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-upload-profile.png", fullPage: true });
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("textbox", { name: "Company" })).toBeVisible();
    await expect(page.locator('textarea').filter({ hasValue: /Built a reliable/ })).toBeVisible();
    await page.screenshot({ path: "test-results/wizard-upload-work.png", fullPage: true });
  });
});
