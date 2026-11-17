import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stillAd } from "../examples/still-ad.mjs";
import {
  AD_HARNESS_VERSION,
  AdHarnessError,
  assertValidClaim,
  canSpend,
  createLedger,
  creditReceipt,
  formatCredits,
  rejectReceipt,
  remainingAds,
  spendCredits,
} from "../src/protocol.mjs";

const isCode = (code) => (error) =>
  error instanceof AdHarnessError && error.code === code;

function claim(overrides = {}) {
  const now = Date.now();
  return {
    version: AD_HARNESS_VERSION,
    adId: stillAd.id,
    sessionId: "ses_test_session_01",
    startedAt: now - 15_000,
    completedAt: now,
    elapsedMs: 15_000,
    reward: 40,
    nonce: "nonce_abcdefghijklmnop",
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    ...claim(),
    receiptId: "rcpt_0123456789012345678901",
    issuedAt: Date.now(),
    signature: "a-signature",
    ...overrides,
  };
}

test("the bundled ad JSON matches the module definition", async () => {
  const json = JSON.parse(
    await readFile(new URL("../examples/ad.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(json, stillAd);
});

test("a completed claim passes the published ad definition", () => {
  assert.doesNotThrow(() => assertValidClaim(claim(), stillAd));
  assert.doesNotThrow(() =>
    assertValidClaim(claim({ elapsedMs: 14_900 }), stillAd),
  );
});

test("a short watch never becomes a valid claim", () => {
  assert.throws(
    () => assertValidClaim(claim({ elapsedMs: 14_700 }), stillAd),
    isCode("claim_invalid"),
  );
});

test("a claim cannot invent watch time or stretch its timestamps", () => {
  assert.throws(
    () => assertValidClaim(claim({ elapsedMs: 1_000_000 }), stillAd),
    isCode("claim_invalid"),
  );
  const now = Date.now();
  assert.throws(
    () =>
      assertValidClaim(claim({ startedAt: now, completedAt: now }), stillAd),
    isCode("claim_invalid"),
  );
});

test("an expired or future claim is refused", () => {
  const now = Date.now();
  assert.throws(
    () =>
      assertValidClaim(claim({ completedAt: now - 6 * 60_000 }), stillAd, now),
    isCode("claim_invalid"),
  );
  assert.throws(
    () =>
      assertValidClaim(claim({ completedAt: now + 2 * 60_000 }), stillAd, now),
    isCode("claim_invalid"),
  );
});

test("the claim must belong to the published ad and reward", () => {
  assert.throws(
    () => assertValidClaim(claim({ adId: "another-sponsor" }), stillAd),
    isCode("ad_mismatch"),
  );
  assert.throws(
    () => assertValidClaim(claim({ reward: 400 }), stillAd),
    isCode("reward_mismatch"),
  );
});

test("malformed session and nonce values are refused", () => {
  assert.throws(
    () => assertValidClaim(claim({ sessionId: "short" }), stillAd),
    isCode("claim_invalid"),
  );
  assert.throws(
    () => assertValidClaim(claim({ nonce: "too-short" }), stillAd),
    isCode("claim_invalid"),
  );
});

test("a receipt is credited once", () => {
  const first = creditReceipt(createLedger(10), receipt(), stillAd, {
    maxAds: 3,
  });
  assert.equal(first.state.balance, 50);
  assert.equal(first.state.adsWatched, 1);
  assert.deepEqual(first.state.usedReceipts, ["rcpt_0123456789012345678901"]);
  assert.equal(first.entry.kind, "grant");
  assert.equal(first.entry.amount, 40);
  assert.throws(
    () => creditReceipt(first.state, receipt(), stillAd, { maxAds: 3 }),
    isCode("receipt_used"),
  );
});

test("a session stops after the configured number of watches", () => {
  let state = createLedger(0);
  for (let index = 0; index < 3; index += 1) {
    const value = receipt({
      receiptId: `rcpt_${String(index).padStart(22, "0")}`,
      nonce: `nonce_${String(index).padStart(18, "0")}`,
    });
    state = creditReceipt(state, value, stillAd, { maxAds: 3 }).state;
  }
  assert.equal(state.balance, 120);
  assert.equal(remainingAds(state, 3), 0);
  assert.throws(
    () =>
      creditReceipt(
        state,
        receipt({
          receiptId: "rcpt_9999999999999999999999",
          nonce: "nonce_999999999999999999",
        }),
        stillAd,
        { maxAds: 3 },
      ),
    isCode("session_cap"),
  );
});

test("a stale receipt cannot be credited later", () => {
  const now = Date.now();
  const value = receipt({
    completedAt: now - 6 * 60_000,
    issuedAt: now - 6 * 60_000,
  });
  assert.throws(
    () => creditReceipt(createLedger(0), value, stillAd, { maxAds: 3, now }),
    isCode("claim_invalid"),
  );
});

test("a future issued receipt is refused", () => {
  const now = Date.now();
  const value = receipt({ issuedAt: now + 10 * 60_000 });
  assert.throws(
    () => creditReceipt(createLedger(0), value, stillAd, { maxAds: 3, now }),
    isCode("claim_invalid"),
  );
});

test("spending is integer only and stops at the balance", () => {
  let state = createLedger(40);
  assert.equal(canSpend(state, 10), true);
  state = spendCredits(state, 10, "Reply · cost").state;
  assert.equal(state.balance, 30);
  assert.equal(state.entries[0].amount, -10);
  assert.throws(
    () => spendCredits(createLedger(5), 10, "Reply · cost"),
    isCode("insufficient_credits"),
  );
  assert.throws(
    () => spendCredits(createLedger(40), 2.5, "Reply · cost"),
    isCode("invalid_amount"),
  );
  assert.throws(
    () => spendCredits(createLedger(40), 0, "Reply · cost"),
    isCode("invalid_amount"),
  );
});

test("a rejection is visible without changing the balance", () => {
  const state = createLedger(20);
  const error = new AdHarnessError(
    "receipt_used",
    "This receipt has already been credited.",
  );
  const next = rejectReceipt(state, error, 1_700_000_000_000);
  assert.equal(next.balance, 20);
  assert.equal(next.entries[0].kind, "reject");
  assert.equal(next.entries[0].amount, 0);
  assert.match(next.entries[0].label, /receipt_used/);
});

test("the ledger is immutable across a credit", () => {
  const original = createLedger(10);
  const snapshot = structuredClone(original);
  creditReceipt(original, receipt(), stillAd, { maxAds: 3 });
  assert.deepEqual(original, snapshot);
});

test("the starting balance and receipt reward are bounded", () => {
  assert.throws(() => createLedger(-1), isCode("invalid_amount"));
  assert.throws(
    () =>
      creditReceipt(createLedger(0), receipt({ reward: 4_000 }), stillAd, {
        maxAds: 3,
      }),
    isCode("reward_mismatch"),
  );
});

test("credit formatting stays readable", () => {
  assert.equal(formatCredits(40), "40");
  assert.equal(formatCredits(1_000), "1,000");
});
