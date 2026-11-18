import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
for (const mode of ["denied", "missing", "pending"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.addInitScript((mode) => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => {
        if (mode === "pending")
          return new Promise((resolve) => {
            window.resolveCamera = resolve;
          });
        throw new DOMException(
          "test",
          mode === "denied" ? "NotAllowedError" : "NotFoundError",
        );
      },
    });
  }, mode);
  await page.goto(process.env.BASE_URL || "http://localhost:5178");
  await page.locator("#start-camera").click();
  if (mode === "pending") {
    await page.locator("#cancel-camera").waitFor({ state: "visible" });
    assert.match(await page.locator("#start-label").innerText(), /Waiting/);
    await page.locator("#cancel-camera").click();
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 100;
      c.height = 100;
      window.lateStream = c.captureStream();
      window.resolveCamera(window.lateStream);
    });
    await page.waitForFunction(() =>
      window.lateStream.getTracks().every((t) => t.readyState === "ended"),
    );
    assert.equal(await page.locator("#start-camera").isEnabled(), true);
    assert.equal(await page.locator("#camera-empty").isVisible(), true);
  } else {
    await page.locator("#status").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#status").innerText(),
      mode === "denied" ? /Allow camera access/ : /No camera/,
    );
    await page.waitForFunction(() =>
      document.querySelector("#rate-summary").textContent.includes("THB"),
    );
    assert.equal(await page.locator("#status").isVisible(), true);
    assert.equal(await page.locator("#start-camera").isEnabled(), true);
    await page.screenshot({
      path: `tests/design-v4-${mode}.png`,
      fullPage: true,
    });
  }
  console.log("PASS", mode);
  await context.close();
}
await browser.close();
