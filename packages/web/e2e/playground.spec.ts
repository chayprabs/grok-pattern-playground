import { test, expect } from "@playwright/test";

test("home page loads playground", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "GrokParse" })).toBeVisible();
  await expect(page.getByLabel("Grok pattern", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Log corpus (one line per row)")).toBeVisible();
});

test("matching shows green results for apache sample", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Sample logs").selectOption("apache");
  await page.waitForTimeout(350);
  const results = page.locator(".status-match");
  await expect(results.first()).toBeVisible({ timeout: 8000 });
});

test("library pattern insert updates compilation", async ({ page }) => {
  await page.goto("/");
  await page.locator("details.library-panel summary").click();
  await page.getByRole("button", { name: "IP", exact: true }).click();
  await page.waitForTimeout(300);
  await expect(page.locator(".result-line").first()).toBeVisible();
});

test("capture highlighting on matched line", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Sample logs").selectOption("nginx");
  await page.waitForTimeout(400);
  await page.locator(".status-match").first().click();
  await expect(page.locator(".capture-highlight").first()).toBeVisible({
    timeout: 8000,
  });
});

test("seo sub-routes load", async ({ page }) => {
  for (const path of [
    "/grok-debugger",
    "/logstash-grok-tester",
    "/grok-to-vector",
    "/grok-to-fluentbit",
    "/grok-pattern-library",
  ]) {
    await page.goto(path);
    await expect(page.getByLabel("Grok pattern", { exact: true })).toBeVisible();
  }
});

test("legal pages", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms and Conditions" })).toBeVisible();
});

test("diff mode shows error when pattern A is invalid", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Diff" }).click();
  await page.getByLabel("Grok pattern", { exact: true }).click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("%{NOTAREALPATTERN999}");
  await page.getByLabel("Log corpus (one line per row)").fill("test line");
  await page.waitForTimeout(300);
  await expect(page.getByText("Fix Pattern A to view diff results.")).toBeVisible();
});

test("export panel copies config", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".export-output")).toContainText("transforms", {
    timeout: 5000,
  });
});
