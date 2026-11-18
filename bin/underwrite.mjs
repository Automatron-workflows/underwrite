#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  UNDERWRITE_VERSION,
  UnderwriteError,
  assertValidClaim,
  createLedger,
  creditReceipt,
  formatCredits,
} from "../src/protocol.mjs";
import {
  DEMO_ISSUER_SECRET,
  issueReceipt,
  verifyReceipt,
} from "../src/issuer.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_AD = resolve(root, "examples/ad.json");
const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

const usage = `underwrite ${pkg.version}

Validate a sponsored watch, issue a single use receipt and move a credit ledger.
No network, accounts or API keys are used.

Usage:
  underwrite demo [--ad <file>] [--json]
  underwrite sample [--ad <file>] [--out <file>] [--json]
  underwrite verify <claim.json> [--ad <file>] [--now <timestamp>] [--json]
  underwrite credit <claim.json> [--ad <file>] [--balance <n>] [--max-ads <n>] [--json]

Commands:
  demo      Generate a fresh claim, verify it, sign a receipt and credit a ledger.
  sample    Write a fresh completion claim for the bundled or supplied ad.
  verify    Validate a completion claim against an ad definition.
  credit    Verify a claim, issue a demo receipt and credit a fresh ledger.

Options:
  --ad <file>       Ad definition JSON. Default: examples/ad.json
  --out <file>      Write sample JSON to a file instead of stdout.
  --now <ms>        Validation time for verify. Default: current time.
  --balance <n>     Starting credits for credit. Default: 10.
  --max-ads <n>     Session cap for credit. Default: 3.
  --json            Print machine readable JSON.
  --help            Show this message.
  --version         Show the package version.
`;

/**
 * @param {string[]} argv
 * @returns {{ command?: string, positionals: string[], flags: Record<string, string | boolean> }}
 */
function parseArgs(argv) {
  const booleanFlags = new Set(["json", "help", "version"]);
  /** @type {string[]} */
  const positionals = [];
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }
    const [name, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) {
      flags[name] = inline;
      continue;
    }
    if (booleanFlags.has(name)) {
      flags[name] = true;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      flags[name] = next;
      index += 1;
    } else {
      flags[name] = true;
    }
  }
  return { command: positionals.shift(), positionals, flags };
}

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function readJson(path) {
  return JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
}

/**
 * @param {string | boolean | undefined} value
 * @param {string} fallback
 * @returns {string}
 */
function flagValue(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

/**
 * @param {string | boolean | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function numberFlag(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @param {string} [path]
 * @returns {Promise<any>}
 */
async function loadAd(path) {
  return readJson(path ?? DEFAULT_AD);
}

/**
 * @param {any} ad
 * @param {number} [now]
 * @returns {any}
 */
function sampleClaim(ad, now = Date.now()) {
  return {
    version: UNDERWRITE_VERSION,
    adId: ad.id,
    sessionId: `ses_${randomBytes(12).toString("base64url")}`,
    startedAt: now - ad.durationMs,
    completedAt: now,
    elapsedMs: ad.durationMs,
    reward: ad.reward,
    nonce: randomBytes(18).toString("base64url"),
  };
}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main() {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));
  if (flags.version || command === "version") {
    process.stdout.write(`${pkg.version}\n`);
    return;
  }
  if (flags.help || command === "help" || !command) {
    process.stdout.write(usage);
    return;
  }

  if (command === "sample") {
    const ad = await loadAd(flagValue(flags.ad, undefined));
    const claim = sampleClaim(ad);
    if (typeof flags.out === "string") {
      await writeFile(
        resolve(process.cwd(), flags.out),
        `${JSON.stringify(claim, null, 2)}\n`,
      );
      process.stdout.write(`Sample claim written to ${flags.out}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify(claim, null, 2)}\n`);
    return;
  }

  if (command === "demo") {
    const ad = await loadAd(flagValue(flags.ad, undefined));
    const claim = sampleClaim(ad);
    assertValidClaim(claim, ad);
    const receipt = await issueReceipt(claim, DEMO_ISSUER_SECRET);
    await verifyReceipt(receipt, DEMO_ISSUER_SECRET);
    const result = creditReceipt(createLedger(10), receipt, ad, { maxAds: 3 });
    if (flags.json) {
      process.stdout.write(
        `${JSON.stringify({ ok: true, ad, claim, receipt, ledger: result.state }, null, 2)}\n`,
      );
      return;
    }
    process.stdout.write(
      [
        `Ad       ${ad.id} · ${ad.sponsor} · ${ad.durationMs / 1000}s · +${ad.reward}`,
        `Claim    valid · ${claim.elapsedMs}ms · nonce ${claim.nonce.slice(0, 8)}`,
        `Receipt  ${receipt.receiptId} · signature valid`,
        `Ledger   +${formatCredits(receipt.reward)} · balance ${formatCredits(result.state.balance)}`,
        `Boundary demo issuer only · no advertiser or payment is connected`,
      ].join("\n") + "\n",
    );
    return;
  }

  if (command === "verify") {
    const path = positionals[0];
    if (!path) fail("verify needs a claim JSON file. Run underwrite --help.");
    const ad = await loadAd(flagValue(flags.ad, undefined));
    const claim = await readJson(path);
    const now = numberFlag(flags.now, Date.now());
    try {
      assertValidClaim(claim, ad, now);
    } catch (error) {
      const code =
        error instanceof UnderwriteError ? error.code : "claim_invalid";
      const message =
        error instanceof Error
          ? error.message
          : "The claim could not be verified.";
      if (flags.json)
        process.stdout.write(
          `${JSON.stringify({ ok: false, code, message })}\n`,
        );
      else process.stderr.write(`Rejected · ${code} · ${message}\n`);
      process.exit(1);
    }
    if (flags.json) {
      process.stdout.write(
        `${JSON.stringify({
          ok: true,
          adId: claim.adId,
          elapsedMs: claim.elapsedMs,
          reward: claim.reward,
        })}\n`,
      );
      return;
    }
    process.stdout.write(
      `Valid · ${claim.adId} · ${claim.elapsedMs}ms · ${formatCredits(claim.reward)} credits\n`,
    );
    return;
  }

  if (command === "credit") {
    const path = positionals[0];
    if (!path) fail("credit needs a claim JSON file. Run underwrite --help.");
    const ad = await loadAd(flagValue(flags.ad, undefined));
    const claim = await readJson(path);
    const balance = numberFlag(flags.balance, 10);
    const maxAds = numberFlag(flags.maxAds, 3);
    try {
      assertValidClaim(claim, ad);
      const receipt = await issueReceipt(claim, DEMO_ISSUER_SECRET);
      await verifyReceipt(receipt, DEMO_ISSUER_SECRET);
      const result = creditReceipt(createLedger(balance), receipt, ad, {
        maxAds,
      });
      if (flags.json) {
        process.stdout.write(
          `${JSON.stringify({ ok: true, receipt, ledger: result.state }, null, 2)}\n`,
        );
        return;
      }
      process.stdout.write(
        [
          `Receipt  ${receipt.receiptId} · signature valid`,
          `Credited +${formatCredits(receipt.reward)} · balance ${formatCredits(result.state.balance)} · ${result.state.adsWatched}/${maxAds} watches`,
        ].join("\n") + "\n",
      );
    } catch (error) {
      const code =
        error instanceof UnderwriteError ? error.code : "claim_invalid";
      const message =
        error instanceof Error
          ? error.message
          : "The claim could not be verified.";
      if (flags.json)
        process.stdout.write(
          `${JSON.stringify({ ok: false, code, message })}\n`,
        );
      else process.stderr.write(`Rejected · ${code} · ${message}\n`);
      process.exit(1);
    }
    return;
  }

  fail(`Unknown command: ${command}. Run underwrite --help.`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
