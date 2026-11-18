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
    document.querySelector("underwrite-card")?.getAttribute("data-status"),
  );
const adAction = (action) =>
  page.evaluate((name) => {
    document
      .querySelector("underwrite-card")
      ?.shadowRoot?.querySelector(`[data-action=${name}]`)
      ?.click();
  }, action);

try {
  await page.goto(server.url, { waitUntil: "domcontentloaded" });
  await page.locator(".uw-experience").waitFor({ timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelector("#balance")?.textContent?.trim() === "10",
  );

  assert.equal(await text("#balance"), "10");
  assert.equal(await page.locator("#send").isDisabled(), true);
  assert.equal(await page.locator("#replay").isDisabled(), true);
  assert.equal(await page.locator("#copy").isDisabled(), true);
  assert.match(await text("#messages"), /A reply costs 10 credits/);
  assert.match(await text(".uw-host"), /Mini · ad supported/);
  const firstView = await page.evaluate(() => ({
    demoTop: document.querySelector("#demo")?.getBoundingClientRect().top,
    deviceVisible:
      (document.querySelector(".uw-device")?.getBoundingClientRect().top ??
        Infinity) < innerHeight,
    intro: !!document.querySelector(".uw-lede, .uw-eyebrow, .uw-contract"),
    inspectSection: !!document.querySelector("section.uw-inspect"),
    inlineAd: !!document.querySelector("underwrite-card")?.closest(".uw-log"),
    rail: !!document.querySelector(".uw-rail"),
    thread: document.querySelector("#thread")?.children.length,
  }));
  assert.ok(firstView.demoTop < 400);
  assert.equal(firstView.deviceVisible, true);
  assert.equal(firstView.intro, false);
  assert.equal(firstView.inspectSection, false);
  assert.equal(firstView.inlineAd, true);
  assert.equal(firstView.rail, false);
  assert.equal(firstView.thread, 0);
  assert.equal(
    await page.evaluate(
      () =>
        !!document
          .querySelector("underwrite-card")
          ?.shadowRoot?.querySelector("[data-action=start]"),
    ),
    true,
  );

  await page.screenshot({ path: `${output}/desktop-inline.png` });

  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const active = document.activeElement;
    const style = getComputedStyle(active);
    return {
      text: active?.textContent?.trim(),
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
    };
  });
  assert.equal(skip.text, "Skip to the demo");
  assert.equal(skip.outline, "solid 2px");

  const smallTargets = await page.evaluate(() => {
    const controls = [
      ...document.querySelectorAll("button, a, summary, input"),
    ];
    const player = document.querySelector("underwrite-card");
    if (player?.shadowRoot)
      controls.push(...player.shadowRoot.querySelectorAll("button"));
    return controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        if (rect.right < 0 || rect.bottom < 0) return false;
        return rect.width < 32 || rect.height < 32;
      })
      .map((element) => ({
        label:
          element.textContent?.trim() || element.getAttribute("aria-label"),
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height),
      }));
  });
  assert.deepEqual(smallTargets, []);

  // Spend the starting credit with a real question, then start the sponsored watch.
  await page.locator("#message").fill("What does a reply cost?");
  await page.locator("#send").click();
  await page.waitForFunction(
    () => document.querySelector("#balance")?.textContent?.trim() === "0",
  );
  assert.equal(await text("#send"), "Earn 40");
  assert.equal(await page.locator("#message").isDisabled(), true);
  assert.equal(
    await page.evaluate(
      () => document.querySelector("#thread")?.children.length,
    ),
    2,
  );
  assert.match(await text("#thread"), /Demo response/);

  await page.locator("#send").click();
  await page.waitForFunction(
    () =>
      document.querySelector("underwrite-card")?.getAttribute("data-status") ===
      "playing",
  );

  await page.waitForFunction(
    () => (document.querySelector("underwrite-card")?.elapsedMs ?? 0) > 1_000,
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
  assert.equal(await text("#balance"), "40");
  assert.match(await text("#messages"), /Receipt verified/);
  assert.equal(await adStatus(), "completed");
  assert.equal(await page.locator("#replay").isEnabled(), true);
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/desktop-completed.png` });

  // The receipt and trace are optional detail behind Developer.
  await page.locator("#developer").scrollIntoViewIfNeeded();
  await page.locator("#developer").click();
  await page.locator("#developer-dialog[open]").waitFor();
  await page.waitForFunction(() => {
    const dialog = document.querySelector("#developer-dialog");
    return dialog?.open && Number(getComputedStyle(dialog).opacity) === 1;
  });
  assert.match(await text("#receipt"), /"receiptId": "rcpt_/);
  assert.match(await text("#trace"), /underwrite:completed/);
  await page.screenshot({ path: `${output}/desktop-developer.png` });

  // A replayed receipt must be visible as a rejection, not a second credit.
  await page.locator("#replay").click();
  assert.equal(await text("#balance"), "40");
  assert.match(await text("#replay-note"), /receipt_used/);
  assert.match(await text("#messages"), /Replay rejected/);

  await page.locator("#reset").click();
  assert.equal(await text("#balance"), "10");
  assert.equal(
    await page.evaluate(
      () => document.querySelector("#thread")?.children.length,
    ),
    0,
  );
  assert.equal(await adStatus(), "idle");
  assert.match(await text("#receipt"), /Complete a watch/);
  await page.locator("#developer-dialog [data-close]").click();
  await page
    .locator("#developer-dialog")
    .waitFor({ state: "hidden", timeout: 5_000 });
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "developer",
  );

  // The explanation is available on demand, not required to use the demo.
  await page.locator("#how").scrollIntoViewIfNeeded();
  await page.locator("#how").click();
  await page.locator("#how-dialog[open]").waitFor();
  assert.match(await text("#how-dialog"), /single use receipt/);
  await page.locator("#how-dialog [data-close]").click();
  await page
    .locator("#how-dialog")
    .waitFor({ state: "hidden", timeout: 5_000 });
  assert.equal(await page.evaluate(() => document.activeElement?.id), "how");

  // Narrow layout: no horizontal overflow, the demo stays usable.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".uw-experience").waitFor({ timeout: 20_000 });
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    demo: document.querySelector("#demo")?.getBoundingClientRect().width,
    nav: Array.from(document.querySelectorAll(".uw-top-nav a")).map((link) => ({
      label: link.textContent.trim(),
      display: getComputedStyle(link).display,
    })),
  }));
  assert.equal(mobile.width, mobile.viewport);
  assert.ok(mobile.demo <= mobile.viewport);
  assert.equal(mobile.nav.length, 1);
  assert.notEqual(mobile.nav[0]?.display, "none");
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/mobile-demo.png` });

  // Leaving the viewport pauses the clock. It does not auto resume.
  await page.setViewportSize({ width: 390, height: 320 });
  await page.locator("underwrite-card").scrollIntoViewIfNeeded();
  await adAction("start");
  await page.waitForFunction(
    () =>
      document.querySelector("underwrite-card")?.getAttribute("data-status") ===
      "playing",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(
    () =>
      document.querySelector("underwrite-card")?.getAttribute("data-status") ===
      "paused",
    null,
    { timeout: 5_000 },
  );
  assert.equal(await adStatus(), "paused");

  // Host previews: the same placement in Claude, ChatGPT and Gemini style shells.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${server.url}hosts.html`, { waitUntil: "domcontentloaded" });
  await page.locator(".host-shell").waitFor();
  assert.equal(
    await page
      .locator('.host-rail [data-host="claude"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator(".host-shell").getAttribute("data-host"),
    "claude",
  );
  assert.match(await text("#host-caption"), /Claude native card/);
  assert.match(await text(".host-native"), /A quieter way to start/);
  await page.screenshot({ path: `${output}/hosts-desktop.png` });

  await page.locator('.host-rail [data-host="chatgpt"]').click();
  assert.equal(
    await page.locator(".host-shell").getAttribute("data-host"),
    "chatgpt",
  );
  assert.match(await text("#host-caption"), /ChatGPT native card/);
  assert.equal(
    await page
      .locator('.host-rail [data-host="chatgpt"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator('.host-rail [data-host="claude"]')
      .getAttribute("aria-pressed"),
    "false",
  );

  await page.locator('.host-compare [data-view="before"]').click();
  assert.match(await text("#host-caption"), /Before/);
  assert.equal(
    await page
      .locator('.host-compare [data-view="before"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator(".host-generic").count(), 1);
  assert.equal(await page.locator(".host-native").count(), 0);
  await page.screenshot({ path: `${output}/hosts-before.png` });

  await page.locator('.host-compare [data-view="after"]').click();
  assert.equal(await page.locator(".host-native").count(), 1);
  assert.equal(await page.locator(".host-generic").count(), 0);

  await page.locator('.host-rail [data-host="gemini"]').click();
  assert.equal(
    await page.locator(".host-shell").getAttribute("data-host"),
    "gemini",
  );
  assert.match(await text("#host-caption"), /Gemini native card/);
  assert.equal(
    await page
      .locator('.host-rail [data-host="gemini"]')
      .getAttribute("aria-pressed"),
    "true",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".host-shell").waitFor();
  const hostMobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    shell: document.querySelector(".host-shell")?.getBoundingClientRect().width,
  }));
  assert.equal(hostMobile.width, hostMobile.viewport);
  assert.ok(hostMobile.shell <= hostMobile.viewport);
  await page.screenshot({ path: `${output}/hosts-mobile.png` });

  assert.deepEqual(errors, []);
  assert.ok(network.length >= 1);
  assert.ok(network.every((url) => url.startsWith(server.url)));

  const summary = {
    checks: [
      "inline sponsored card sits in the conversation",
      "model scoped credit chip",
      "no side rail",
      "usable object leads the page",
      "skip link and focus outline",
      "visible controls meet the 32 pixel review floor",
      "initial balance and locked composer",
      "scripted reply spends one credit",
      "pause and resume",
      "completion credits 40 once",
      "developer detail behind Developer",
      "receipt replay is refused",
      "reset restores the session",
      "explanation behind How it works",
      "leaving the viewport pauses",
      "390 pixel layout has no horizontal overflow",
      "host previews for Claude, ChatGPT and Gemini",
      "Before and After card comparison",
      "host previews at 390 pixels",
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
