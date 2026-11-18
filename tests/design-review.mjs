import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
for (const [width, height, name] of [
  [390, 844, "mobile"],
  [1440, 1000, "desktop"],
  [320, 640, "small"],
  [844, 390, "landscape"],
]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://localhost:5178");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document.querySelector("#rate-summary").textContent.includes("THB"),
  );
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `${name} overflow`,
  );
  const button = await page.locator("#start-camera").boundingBox();
  console.log({
    name,
    buttonY: button.y,
    buttonBottom: button.y + button.height,
    height,
    bodyHeight: await page.evaluate(() => document.body.scrollHeight),
  });
  await page.screenshot({
    path: `tests/design-v4-${name}.png`,
    fullPage: true,
  });
  if (name === "mobile") {
    await page.locator("#choose-to").click();
    await page.screenshot({ path: "tests/design-v4-picker.png" });
    await page.locator("#currency-search").fill("japan");
    await page.locator("[data-code=JPY]").click();
    assert.equal(await page.locator("#to-label").innerText(), "JPY");
    await page.locator("#choose-from").click();
    await page.locator("#currency-search").fill("zzzz");
    assert.match(await page.locator(".no-results").innerText(), /No matching/);
    await page.keyboard.press("Escape");
    await page.locator("#help").click();
    await page.screenshot({ path: "tests/design-v4-help.png" });
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  await context.close();
}
await browser.close();
