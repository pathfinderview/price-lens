import { chromium, webkit } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser =
  process.env.BROWSER === "webkit"
    ? await webkit.launch({ headless: true })
    : await chromium.launch({
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true,
      });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.addInitScript(() => {
  window.testPrice = "589.00";
  window.testStreams = [];
  window.testMediaDevices = navigator.mediaDevices;
  Object.defineProperty(window.testMediaDevices, "getUserMedia", {
    value: async () => {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 1600;
      const x = c.getContext("2d");
      const draw = () => {
        x.fillStyle = "#ffffff";
        x.fillRect(0, 0, c.width, c.height);
        if (window.testPrice) {
          x.fillStyle = "#111111";
          x.font = "bold 160px Arial";
          x.fillText(window.testPrice, 150, 700);
          x.font = "50px Arial";
          x.fillText("THB", 150, 810);
        }
      };
      draw();
      const timer = setInterval(draw, 80);
      const stream = c.captureStream(15);
      window.testStreams.push(stream);
      stream
        .getTracks()[0]
        .addEventListener("ended", () => clearInterval(timer));
      return stream;
    },
  });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL || "http://localhost:5178");
await page.waitForFunction(
  () => document.querySelector("#rate-detail").textContent.includes("2."),
  null,
  { timeout: 20000 },
);
assert.equal(await page.locator("input[type=file]").count(), 0);
assert.equal(await page.locator("#capture").count(), 0);
await page.locator("#start-camera").click();
await page.waitForFunction(
  () => document.querySelectorAll(".price-overlay").length > 0,
  null,
  { timeout: 90000 },
);
const loadedRate = Number(
  (await page.locator("#rate-detail").innerText()).match(/= ([\d.]+)/)[1],
);
const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n * loadedRate);
assert.equal(await page.locator("#converted").innerText(), inr(589));
assert.match(await page.locator(".price-overlay").first().innerText(), /₹/);
await page.screenshot({ path: "tests/live.png", fullPage: true });
await page.evaluate(() => {
  window.testPrice = "1250.50";
});
await page.waitForFunction(
  () => document.querySelector("#amount").value === "1250.5",
  null,
  { timeout: 20000 },
);
assert.equal(await page.locator("#converted").innerText(), inr(1250.5));
await page.locator("#choose-to").click();
await page.locator("#currency-search").fill("THB");
await page.locator("[data-code=THB]").click();
await page.waitForFunction(
  () => document.querySelector("#rate-date").textContent === "Same currency",
);
await page.waitForFunction(
  () => document.querySelector("#amount").value === "1250.5",
  null,
  { timeout: 15000 },
);
assert.match(await page.locator("#converted").innerText(), /1,250.5/);
await page.evaluate(() => {
  window.testPrice = "";
});
await page.waitForFunction(
  () =>
    document.querySelectorAll(".price-overlay").length === 0 &&
    document.querySelector("#amount").value === "",
  null,
  { timeout: 12000 },
);
assert.equal(
  await page.locator("#converted").innerText(),
  "Looking for a price…",
);
await page.evaluate(() => {
  window.testPrice = "589.00";
});
await page.waitForFunction(
  () => document.querySelector("#amount").value === "589",
  null,
  { timeout: 15000 },
);
await page.locator("#close-camera").click();
assert.equal(await page.locator("video").evaluate((v) => v.srcObject), null);
assert.equal(await page.locator(".price-overlay").count(), 0);
assert(
  await page.evaluate(() =>
    window.testStreams.every((s) =>
      s.getTracks().every((t) => t.readyState === "ended"),
    ),
  ),
);
await page.waitForTimeout(1400);
assert.equal(await page.locator(".price-overlay").count(), 0);
await page.locator("#start-camera").click();
try {
  await page.waitForFunction(
    () => document.querySelector("#amount").value === "589",
    null,
    { timeout: 15000 },
  );
} catch (error) {
  console.log(
    await page.evaluate(() => ({
      status: document.querySelector("#status").textContent,
      live: document.querySelector("#live-state").textContent,
      video: {
        width: document.querySelector("video").videoWidth,
        height: document.querySelector("video").videoHeight,
        paused: document.querySelector("video").paused,
        ready: document.querySelector("video").readyState,
        time: document.querySelector("video").currentTime,
      },
      streams: window.testStreams?.map((s) =>
        s.getTracks().map((t) => ({ state: t.readyState, enabled: t.enabled })),
      ),
    })),
  );
  throw error;
}
await page.locator("#close-camera").click();
for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `overflow ${width}`,
  );
}
await page.locator("#help").click();
await page.getByRole("button", { name: "Close details" }).click();
await page.locator("#choose-to").click();
await page.locator("#currency-search").fill("INR");
await page.locator("[data-code=INR]").click();
await page.waitForFunction(() =>
  document.querySelector("#rate-date").textContent.includes("2026"),
);
await page.route("https://api.frankfurter.dev/**", (r) =>
  r.abort("internetdisconnected"),
);
await context.setOffline(true);
await page.locator("#rate-toggle").click();
await page.locator("#refresh").click();
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("saved reference"),
);
assert.match(await page.locator("#status").innerText(), /saved reference/);
assert.deepEqual(errors, []);
const passed = [
  "no photo or capture UI",
  "live video real OCR",
  "automatic overlay conversion",
  "changing price refreshes without taps",
  "same-currency update",
  "old price clears on blank video",
  "close releases camera",
  "late OCR cannot restore closed overlays",
  "reopen resumes live OCR",
  "four responsive widths",
  "help",
  "saved-rate fallback",
  "no uncaught errors",
];
console.log(JSON.stringify({ passed }, null, 2));
await fs.writeFile(
  "tests/browser-result.json",
  JSON.stringify({ passed, date: new Date().toISOString() }, null, 2),
);
await browser.close();
