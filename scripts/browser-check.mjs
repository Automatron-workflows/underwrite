// A real Chrome check for the standalone demo. It serves the built _site
// locally, runs the complete watch and credit flow, and inspects mobile layout.
// No external site is visited.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { startServer } from "./serve.mjs";

const output = "output/browser";
await mkdir(output, { recursive: true });

const server = await startServer({ root: "_site" });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: "chrome" }),
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const network = [];
page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.protocol === "http:" || url.protocol === "https:")
    network.push(request.url());
});

const text = async (selector) =>
  (await page.locator(selector).textContent())?.trim();
const adStatus = () =>
  page.evaluate(() =>
    document.querySelector("ad-harness")?.getAttribute("data-status"),
  );
const adAction = (action) =>
  page.evaluate((name) => {
    document
      .querySelector("ad-harness")
      ?.shadowRoot?.querySelector(`[data-action=${name}]`)
      ?.click();
  }, action);

try {
  await page.goto(server.url, { waitUntil: "domcontentloaded" });
  await page.locator(".ah-experience").waitFor({ timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector("#balance")?.textContent?.trim() === "10",
  );

  assert.equal(await text("#balance"), "10");
  assert.equal(await text("#state"), "Awaiting a watch");
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#replay").isDisabled(), true);
  assert.equal(await page.locator("#copy").isDisabled(), true);
  assert.match(await text("#messages"), /working chat surface/);
  assert.equal(
    await page.evaluate(
      () =>
        !!document
          .querySelector("ad-harness")
          ?.shadowRoot?.querySelector("[data-action=start]"),
    ),
    true,
  );

  // Spend the starting credit, then start the sponsored watch from the composer.
  await page.locator(".ah-starters button").first().click();
  await page.waitForFunction(
    () => document.querySelector("#balance")?.textContent?.trim() === "0",
  );
  assert.equal(await text("#send"), "Earn 40");
  assert.equal(await page.locator("#message").isDisabled(), true);
  assert.match(await text("#messages"), /Scripted demo response/);

  await page.locator("#send").click();
  await page.waitForFunction(
    () =>
      document.querySelector("ad-harness")?.getAttribute("data-status") ===
      "playing",
  );

  await page.waitForFunction(
    () => (document.querySelector("ad-harness")?.elapsedMs ?? 0) > 1_000,
    null,
    { timeout: 5_000 },
  );
  await adAction("pause");
  assert.equal(await adStatus(), "paused");
  await adAction("resume");
  assert.equal(await adStatus(), "playing");

  await page.waitForFunction(
    () => document.querySelector("#balance")?.textContent?.trim() === "40",
    null,
    { timeout: 30_000 },
  );
  assert.equal(await text("#state"), "Verified");
  assert.match(await text("#receipt"), /"receiptId": "rcpt_/);
  assert.match(await text("#ledger"), /\+40/);
  assert.equal(await page.locator("#replay").isEnabled(), true);
  assert.match(await text("#trace"), /adharness:completed/);
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/desktop-completed.png` });

  // A replayed receipt must be visible as a rejection, not a second credit.
  await page.locator("#replay").click();
  assert.equal(await text("#balance"), "40");
  assert.match(await text("#replay-note"), /receipt_used/);
  assert.match(await text("#ledger"), /Rejected · receipt_used/);

  await page.locator("#reset").click();
  assert.equal(await text("#balance"), "10");
  assert.equal(await text("#state"), "Awaiting a watch");
  assert.match(await text("#ledger"), /No movements yet/);
  assert.match(await text("#receipt"), /Complete a watch/);

  // Leaving the viewport pauses the clock. It does not auto resume.
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await adAction("start");
  await page.waitForFunction(
    () =>
      document.querySelector("ad-harness")?.getAttribute("data-status") ===
      "playing",
  );
  await page.locator("#inspect").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      document.querySelector("ad-harness")?.getAttribute("data-status") ===
      "paused",
    null,
    { timeout: 5_000 },
  );
  assert.equal(await adStatus(), "paused");
  await page.locator("#reset").click();

  // Narrow layout: no horizontal overflow, the demo stays usable.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".ah-experience").waitFor({ timeout: 20_000 });
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    demo: document.querySelector("#demo")?.getBoundingClientRect().width,
    nav: Array.from(document.querySelectorAll(".ah-top-nav a")).map((link) => ({
      label: link.textContent.trim(),
      display: getComputedStyle(link).display,
    })),
  }));
  assert.equal(mobile.width, mobile.viewport);
  assert.ok(mobile.demo <= mobile.viewport);
  assert.deepEqual(
    mobile.nav.slice(0, 2).map((item) => item.display),
    ["none", "none"],
  );
  assert.notEqual(mobile.nav[2]?.display, "none");
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/mobile-demo.png` });

  assert.deepEqual(errors, []);
  assert.ok(network.length >= 1);
  assert.ok(network.every((url) => url.startsWith(server.url)));

  const summary = {
    checks: [
      "initial balance and locked composer",
      "scripted reply spends one credit",
      "pause and resume",
      "completion credits 40 once",
      "receipt replay is refused",
      "reset restores the session",
      "leaving the viewport pauses",
      "390 pixel layout has no horizontal overflow",
    ],
    requests: network,
    errors,
  };
  await writeFile(
    `${output}/summary.json`,
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  process.stdout.write(`Browser checks passed. Screenshots: ${output}/\n`);
} finally {
  await browser.close();
  await server.close();
}
