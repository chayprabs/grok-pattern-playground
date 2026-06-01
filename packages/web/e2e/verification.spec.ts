import { test, expect } from "@playwright/test";

function shareUrl(state: Record<string, unknown>) {
  const json = JSON.stringify(state);
  const hash = Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `/#${hash}`;
}

async function waitForPatternEditor(page: import("@playwright/test").Page) {
  await page
    .getByRole("group", { name: "Grok pattern", exact: true })
    .locator(".monaco-editor")
    .waitFor({ timeout: 10000 });
}

test.describe("verification pass", () => {
  test("share URL restores pattern, corpus, diff mode, and export target", async ({
    page,
  }) => {
    const state = {
      pattern: "%{WORD:first} %{WORD:second}",
      patternB: "%{GREEDYDATA:msg}",
      corpus: "hello world",
      mode: "diff",
      engine: "logstash",
    };
    await page.goto(shareUrl(state));
    await page.waitForTimeout(300);

    await expect(page.locator("#pattern")).toHaveValue(state.pattern);
    await expect(page.locator("#corpus")).toHaveValue(state.corpus);
    await expect(page.getByRole("button", { name: "Diff" })).toHaveClass(/active/);
    await expect(page.locator("#pattern-b")).toHaveValue(state.patternB);
    await expect(page.locator(".export select")).toHaveValue("logstash");
    await expect(page.locator(".export-output")).toContainText("filter {");
  });

  test("pattern and corpus produce typed capture output", async ({ page }) => {
    await page.goto(
      shareUrl({
        pattern: "%{WORD:token}",
        corpus: "alpha\nbeta",
        mode: "single",
      }),
    );
    await page.waitForTimeout(600);

    await expect(page.locator(".status-match")).toHaveCount(2, { timeout: 15000 });
    await page.locator(".status-match").first().click();
    await expect(page.getByRole("cell", { name: "token" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "alpha" })).toBeVisible();
  });

  test("sample logs load pattern and corpus", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Sample logs").selectOption("syslog");
    await page.waitForTimeout(400);

    await expect(page.locator("#pattern")).toHaveValue(/SYSLOGTIMESTAMP/);
    await expect(page.locator("#corpus")).toHaveValue(/sshd/);
    await expect(page.locator(".status-match").first()).toBeVisible({ timeout: 8000 });
  });

  test("diff mode compares two valid patterns", async ({ page }) => {
    const state = {
      pattern: "%{WORD:a}",
      patternB: "%{GREEDYDATA:b}",
      corpus: "one two",
      mode: "diff",
    };
    await page.goto(shareUrl(state));
    await page.waitForTimeout(400);

    await expect(page.locator(".result-line")).toHaveCount(1);
    await expect(page.locator(".result-line").first()).toContainText("A:✓");
    await expect(page.locator(".result-line").first()).toContainText("B:✓");
  });

  test("diff mode shows error when pattern B is invalid", async ({ page }) => {
    const state = {
      pattern: "%{GREEDYDATA:msg}",
      patternB: "%{NOTAREALPATTERN999}",
      corpus: "test line",
      mode: "diff",
    };
    await page.goto(shareUrl(state));
    await page.waitForTimeout(400);

    await expect(page.getByText("Fix Pattern B to view diff results.")).toBeVisible({
      timeout: 8000,
    });
  });

  test("export targets produce distinct valid outputs", async ({ page }) => {
    await page.goto("/");
    await waitForPatternEditor(page);

    const exportSelect = page.locator(".export select");
    const output = page.locator(".export-output");

    await exportSelect.selectOption("vector");
    await expect(output).toContainText("parse_grok!");

    await exportSelect.selectOption("opensearch");
    await expect(output).toContainText('"processors"');

    await exportSelect.selectOption("fluentbit");
    await expect(output).toContainText("[PARSER]");

    await exportSelect.selectOption("javascript");
    await expect(output).toContainText("export function parseLine");

    await exportSelect.selectOption("logstash");
    await expect(output).toContainText("tag_on_failure");
  });

  test("copy share link encodes current playground state", async ({ page }) => {
    await page.goto("/");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByLabel("Sample logs").selectOption("nginx");
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Copy share link" }).click();

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(/#\w+/);
    const payload = Buffer.from(clip.split("#")[1] ?? "", "base64").toString("utf8");
    expect(payload).toContain("NGINXACCESS");

    await page.goto(clip.replace(/^https?:\/\/[^/]+/, ""));
    await page.waitForTimeout(300);
    await expect(page.locator("#pattern")).toHaveValue(/NGINXACCESS/);
  });

  test("library search filters by example and pattern text", async ({ page }) => {
    await page.goto("/");
    await page.locator("details.library-panel summary").click();

    await page.getByPlaceholder("Search patterns…").fill("user@example.com");
    await expect(page.getByRole("button", { name: "EMAILADDRESS", exact: true })).toBeVisible();

    await page.getByPlaceholder("Search patterns…").fill("IPV4SEG");
    await expect(page.getByRole("button", { name: "IPV4", exact: true })).toBeVisible();
  });

  test("library insert inserts token at editor cursor", async ({ page }) => {
    await page.goto(
      shareUrl({
        pattern: "foo bar",
        corpus: "192.168.0.1",
        mode: "single",
      }),
    );
    await waitForPatternEditor(page);
    await page.locator("details.library-panel summary").click();

    await page.getByRole("group", { name: "Grok pattern" }).locator(".monaco-editor").click();
    await page.keyboard.press("End");

    await page.getByRole("button", { name: "IP", exact: true }).click();
    await page.waitForTimeout(200);

    await expect(page.locator("#pattern")).toHaveValue("foo bar%{IP}");
  });

  test("custom pattern works and worker benchmark runs for 55+ lines", async ({
    page,
  }) => {
    const lines = Array.from({ length: 55 }, (_, i) => `word${i}`).join("\n");
    await page.addInitScript(() => {
      localStorage.setItem(
        "grokparse-custom-patterns",
        JSON.stringify({ MYLINE: { name: "MYLINE", pattern: "[a-z]+" } }),
      );
    });
    await page.goto(
      shareUrl({
        pattern: "%{MYLINE:word}",
        corpus: lines,
        mode: "single",
      }),
    );
    await waitForPatternEditor(page);
    await expect(page.locator("#pattern")).toHaveValue("%{MYLINE:word}", {
      timeout: 10000,
    });
    await expect(page.locator(".status-match")).toHaveCount(55, { timeout: 10000 });

    await expect(page.getByText(/matches\/sec/)).toBeVisible({ timeout: 25000 });
    await expect(page.getByText("(worker)", { exact: false })).toBeVisible({
      timeout: 5000,
    });
  });

  test("slow warning appears for high ReDoS patterns without freezing", async ({
    page,
  }) => {
    await page.goto(
      shareUrl({
        pattern: "(a+)+b",
        corpus: "test line",
        mode: "single",
      }),
    );
    await page.waitForTimeout(600);
    const badge = page.locator(".redos-badge");
    await expect(badge).toContainText("ReDoS: high", { timeout: 10000 });
    await expect(
      page.getByText("Worst-case input may exceed 100ms", { exact: false }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Single" })).toBeEnabled();
  });

  test("ReDoS badge shows high risk for catastrophic pattern", async ({ page }) => {
    await page.goto(
      shareUrl({
        pattern: "(a+)+",
        corpus: "aaa",
        mode: "single",
      }),
    );
    await page.waitForTimeout(300);

    const badge = page.locator(".redos-badge");
    await expect(badge).toContainText("ReDoS: high");
    await expect(badge).toHaveAttribute("data-risk", "high");
  });

  test("Monaco editors expose accessible labels", async ({ page }) => {
    await page.goto("/");
    await waitForPatternEditor(page);

    await expect(page.getByRole("group", { name: "Grok pattern" })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Log corpus (one line per row)" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Grok pattern", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Diff" }).click();
    await expect(page.getByRole("group", { name: "Pattern B" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Pattern B", exact: true })).toBeVisible();
  });
});
