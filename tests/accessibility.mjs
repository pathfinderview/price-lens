import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
await page.goto(process.env.BASE_URL || "http://localhost:5178");
await page.evaluate(() => document.fonts.ready);
for (const state of ["opening", "currency", "help", "rates"]) {
  if (state === "currency") await page.locator("#choose-to").click();
  if (state === "help") await page.locator("#help").click();
  if (state === "rates") await page.locator("#rate-toggle").click();
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {})),
    );
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    JSON.stringify(
      {
        state,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      },
      null,
      2,
    ),
  );
  assert.equal(
    results.violations.length,
    0,
    `Accessibility violations in ${state}`,
  );
  if (state !== "opening") {
    const dialog = page.locator("dialog[open]");
    if (await dialog.count()) await dialog.locator(".icon-button").click();
  }
}
await browser.close();
