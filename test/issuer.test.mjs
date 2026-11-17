import test from "node:test";
import assert from "node:assert/strict";
import { stillAd } from "../examples/still-ad.mjs";
import { AD_HARNESS_VERSION, AdHarnessError } from "../src/protocol.mjs";
import {
  DEMO_ISSUER_SECRET,
  issueReceipt,
  verifyReceipt,
} from "../src/issuer.mjs";

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

test("a completed claim becomes a verifiable single use receipt", async () => {
  const receipt = await issueReceipt(claim(), DEMO_ISSUER_SECRET);
  assert.match(receipt.receiptId, /^rcpt_[A-Za-z0-9_-]{22}$/);
  assert.equal(receipt.receiptId.length, 27);
  assert.equal(await verifyReceipt(receipt, DEMO_ISSUER_SECRET), true);
});

test("the same claim produces the same receipt id but a fresh nonce changes it", async () => {
  const base = claim();
  const first = await issueReceipt(base, DEMO_ISSUER_SECRET);
  const second = await issueReceipt(base, DEMO_ISSUER_SECRET);
  assert.equal(first.receiptId, second.receiptId);
  const different = await issueReceipt(
    { ...base, nonce: "nonce_zyxwvutsrqponmlk" },
    DEMO_ISSUER_SECRET,
  );
  assert.notEqual(first.receiptId, different.receiptId);
});

test("a tampered claim is refused before the ledger moves", async () => {
  const receipt = await issueReceipt(claim(), DEMO_ISSUER_SECRET);
  await assert.rejects(
    () => verifyReceipt({ ...receipt, elapsedMs: 3_000 }, DEMO_ISSUER_SECRET),
    isCode("signature_invalid"),
  );
});

test("a tampered receipt id is refused", async () => {
  const receipt = await issueReceipt(claim(), DEMO_ISSUER_SECRET);
  await assert.rejects(
    () =>
      verifyReceipt(
        { ...receipt, receiptId: "rcpt_0000000000000000000000" },
        DEMO_ISSUER_SECRET,
      ),
    isCode("signature_invalid"),
  );
});

test("a receipt signed with another key is refused", async () => {
  const receipt = await issueReceipt(claim(), DEMO_ISSUER_SECRET);
  await assert.rejects(
    () => verifyReceipt(receipt, "a-different-issuer"),
    isCode("signature_invalid"),
  );
});

test("an incomplete receipt is refused", async () => {
  await assert.rejects(
    () => verifyReceipt({ ...claim() }, DEMO_ISSUER_SECRET),
    isCode("receipt_invalid"),
  );
});

test("the demo issuer refuses a malformed claim shape", async () => {
  await assert.rejects(
    () => issueReceipt({ ...claim(), reward: 0 }, DEMO_ISSUER_SECRET),
    isCode("claim_invalid"),
  );
  await assert.rejects(
    () => issueReceipt({ ...claim(), nonce: "" }, DEMO_ISSUER_SECRET),
    isCode("claim_invalid"),
  );
});
